import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';

export function getVaultSecretAction(config: Config) {
  return createTemplateAction({
    id: 'vault:get-secret',
    description: 'get a secret from vault',
    schema: {
      input: {
        type: 'object',
        required: ['path'],
        properties: {
          path: {
            type: 'string',
            title: 'Path',
            description: 'The path for the secret',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            description: 'The secret data',
          },
        },
      },
    },
    async handler(ctx) {
      const vaultUrl = config.getString('rhdhVault.baseUrl');
      const vaultToken = config.getString('rhdhVault.token');
      const vaultPathArray = ctx.input.path.split("/")
      if (vaultPathArray.length != 2) throw new Error('path must be "<mount>/<secret>"');

      if (!vaultToken) {
        throw new Error('Missing vault token configuration');
      }

      const response = await fetch(`${vaultUrl}/v1/${vaultPathArray[0]}/data/${vaultPathArray[1]}`, {
        method: 'GET',
        headers: {
          'X-Vault-Token': vaultToken,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vault get request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      ctx.output('data', data.data?.data);
    },
  });
}