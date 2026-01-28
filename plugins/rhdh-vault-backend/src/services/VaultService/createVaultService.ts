import { LoggerService } from '@backstage/backend-plugin-api';
import { NotFoundError } from '@backstage/errors';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { Config } from '@backstage/config';
import crypto from 'node:crypto';
import { VaultItem, VaultPath, VaultService } from './types';

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

    const storedSecrets = new Array<VaultItem>();
    const testNewSecret: VaultItem = {
        path: 'testItem',
        version: '1',
        key: 'testKey',
        value: 'testValue',
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

        async listVaultSecretPaths(request: { mountPath: string }) {
            if (!vaultToken) {
                throw new Error('Missing vault token configuration');
            }
            const response = await fetch(`${vaultAddr}/v1/${request.mountPath}/metadata`, {
                method: 'LIST',
                headers: {
                    'X-Vault-Token': vaultToken,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Vault mounts request failed: ${response.status} ${errorText}`);
            }
            const {data} = await response.json();
            return data.keys;
        },

        async listVaultMountPaths() {

            if (!vaultToken) {
                throw new Error('Missing vault token configuration');
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
            const data: VaultPath = await response.json();
            const kvMounts = Object.entries(data)
                .filter(([_, meta]) => meta && meta['type'] === 'kv')
                .map(([path, meta]) => ({ [path]: { ...meta } }));

            return { mounts: kvMounts };
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

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Vault get secret failed: ${response.status} ${errorText}`);
            }

            const vaultResponse = await response.json();
            logger.info(`Vault response: ${JSON.stringify(vaultResponse, null, 2)}`);

            // Vault KV v2 format: { data: { data: { key: value }, metadata: {...} } }
            if (!vaultResponse.data) {
                logger.warn('No data field in Vault response');
                return { secrets: [] };
            }

            const secretData = vaultResponse.data.data || {};
            const metadata = vaultResponse.data.metadata || {};

            // Convert key-value pairs to VaultItem array
            const secrets = Object.entries(secretData).map(([key, value]) => ({
                path: `${request.mountPath}/${request.secretPath}`,
                key: key,
                value: String(value),
                version: String(metadata.version || '1'),
                createdBy: metadata.created_by || 'unknown',
                createdAt: metadata.created_time || new Date().toISOString(),
            }));

            logger.info(`Retrieved ${secrets.length} secret(s) from ${request.mountPath}/${request.secretPath}`);
            return { secrets };
        },
    };
}
