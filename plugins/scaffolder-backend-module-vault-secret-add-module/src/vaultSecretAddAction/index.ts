import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';

export function createVaultSecretAction(config: Config) {
  return createTemplateAction({
    id: 'vault:add-secret',
    description: 'adds a secret in vault',
    schema: {
      input: {
        type: 'object',
        required: ['path', 'key', 'value'],
        properties: {
          path: {
            type: 'string',
            title: 'Path',
            description: 'The path for the secret',
          },
          key: {
            type: 'string',
            title: 'Key',
            description: 'The key for the secret',
          },
          value: {
            type: 'string',
            title: 'Value',
            description: 'The value for the secret',
          },
        },
      },
    },
    async handler(ctx) {
      const vaultUrl = config.getString('rhdhVault.baseUrl');
      const vaultToken = config.getString('rhdhVault.token');
      const vaultPathArray = ctx.input.path.split("/")
      if (vaultPathArray.length != 2) throw new Error('path must be "<mount>/<secret>"');

      ctx.logger.info('Writing secret to Vault…');
      ctx.logger.debug(`Mount=${vaultPathArray[0]} Path=${vaultPathArray[1]}`);

      ctx.logger.info(`${vaultUrl}/v1/${vaultPathArray[0]}/${vaultPathArray[1]}`)

      if (!vaultToken) {
        throw new Error('Missing vault token configuration');
      }

      // Check for secret location or create
      const checkResponse = await fetch(`${vaultUrl}/v1/sys/mounts/${vaultPathArray[0]}`, {
        method: 'GET',
        headers: {
          'X-Vault-Token': vaultToken,
          'Content-Type': 'application/json',
        },
      });

      if (checkResponse.status!= 200) {
        ctx.logger.info(`Could not find mount path ${vaultPathArray[0]}. Attempting to create...`);

        const createMountPayload = {
          type: 'kv',
          options: {
            version: '2'
          }
        };

        const createMountResponse = await fetch(`${vaultUrl}/v1/sys/mounts/${vaultPathArray[0]}`, {
          method: 'POST',
          headers: {
            'X-Vault-Token': vaultToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createMountPayload)
        });

        if (!createMountResponse.ok) {
          throw new Error(`Failed to create mount: ${createMountResponse.status}`)
        }

        ctx.logger.info(`Created mount path ${vaultPathArray[0]}.`)

      }

      const vaultKey = ctx.input.key
      const vaultValue = ctx.input.value
      const payload = {
        data: { [vaultKey]: vaultValue },
      };

      // Post new secret
      const response = await fetch(`${vaultUrl}/v1/${vaultPathArray[0]}/data/${vaultPathArray[1]}`, {
        method: 'POST',
        headers: {
          'X-Vault-Token': vaultToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      ctx.logger.info(`Vault response status: ${response.status}`);
      ctx.logger.info(`Vault response:}`);
      ctx.logger.info(JSON.stringify(response))

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vault post request failed: ${response.status} ${errorText}`);
      }
    },
  });
}