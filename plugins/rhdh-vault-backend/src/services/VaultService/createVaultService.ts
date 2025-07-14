import { LoggerService } from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { Config } from '@backstage/config';
import crypto from 'node:crypto';
import { VaultItem, VaultService } from './types';

// TEMPLATE NOTE:
// This is a simple in-memory todo list store. It is recommended to use a
// database to store data in a real application. See the database service
// documentation for more information on how to do this:
// https://backstage.io/docs/backend-system/core-services/database
export async function createVaultService({
    logger,
    catalog,
    config,
}: {
    logger: LoggerService;
    catalog: typeof catalogServiceRef.T;
    config: Config;
}): Promise<VaultService> {
    logger.info('Initializing VaultService');
    const vaultConfig = config.getConfig('rhdhVault');
    const vaultAddr = vaultConfig.getString('baseUrl');
    const vaultToken = vaultConfig.getString('token');
    const defaultKeyPath = vaultConfig.getString('defaultKeyPath');

    const storedSecrets = new Array<VaultItem>();
    const testNewSecret: VaultItem = {
        path: 'testItem',
        version: '1',
        key: 'test',
        value: 'test',
        createdBy: 'test',
        createdAt: new Date().toISOString(),
    };
    storedSecrets.push(testNewSecret)

    return {
        async createVaultItem(input, options) {
            let path = input.path;
            if (input.entityRef) {
                const entity = await catalog.getEntityByRef(input.entityRef, options);
                if (!entity) {
                    throw new NotFoundError(
                        `No entity found for ref '${input.entityRef}'`,
                    );
                }

                const entityDisplay = entity.metadata.title ?? input.entityRef;
                path = `[${entityDisplay}] ${input.path}`;
            }

            const version = '1'
            const key = 'testKey'
            const value = 'testValue'
            const createdBy = options.credentials.principal.userEntityRef;
            const newSecret = {
                path,
                key,
                value,
                version,
                createdBy,
                createdAt: new Date().toISOString(),
            };

            storedSecrets.push(newSecret);
            logger.info('Created new secret item', { path, version, createdBy });
            return newSecret;
        },

        async listVaultSecretsOLD() {

            return { secrets: Array.from(storedSecrets) };
        },

        async listVaultSecrets() {

            if (!vaultToken) {
                return {
                    success: false,
                    error: 'Vault configuration error: missing token',
                    statusCode: 500,
                    secrets: [],
                };
            }
            const response = await fetch(`${vaultAddr}/v1/sys/mounts`, {
                method: 'GET',
                headers: {
                    'X-Vault-Token': vaultToken,
                },
            });


            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Vault mounts request failed: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            const storedSecrets = Object.entries(data)
                .filter(([myPath, meta]: [string, any]) => meta.type === 'kv')
                .map(([myPath, meta]: [string, any]) => ({
                    path: myPath,
                    key: 'testKey',
                    value: 'testValue',
                    createdBy: '',
                    createdAt: '',
                    version: meta.options?.version || '1',
                }));


            return { secrets: storedSecrets };
        },


        async getVaultSecret(request: { mountPath: string, secretPath: string }): Promise<{ secrets: VaultItem[] }> {

            if (!vaultToken) {
                throw new Error('Missing vault token configuration');
            }
            const response = await fetch(`${vaultAddr}/v1/${request.mountPath}/data/${request.secretPath}`, {
                method: 'GET',
                headers: {
                    'X-Vault-Token': vaultToken,
                },
            });

            logger.info("SENT TO: " + `${vaultAddr}/v1/secret/data/${request.path}`)
            logger.info('Status: ' + response.status);
            logger.info('Status Text: ' + response.statusText);
            logger.info('Headers: ' + Object.fromEntries(response.headers.entries()));

            const responseClone = response.clone();

            try {
                const json = await responseClone.json();
                console.log('JSON Body:', json);
            } catch (err) {
                logger.info("TEST")
            }


            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Vault mounts request failed: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            const storedSecrets = Object.entries(data)
                .filter(([myPath, meta]: [string, any]) => meta.type === 'kv')
                .map(([myPath, meta]: [string, any]) => ({
                    path: myPath,
                    key: 'testKey',
                    value: 'testValue',
                    version: meta.options?.version || '1',
                    createdBy: '',
                    createdAt: '',
                }));


            return { secrets: storedSecrets };
        },
    };
}
