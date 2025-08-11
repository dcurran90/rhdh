import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';

export function deleteVaultSecretAction(config: Config) {
  return createTemplateAction({
    id: 'vault:delete-secret',
    description: 'delete a secret from vault',
    schema: {
      input: (z) =>
        z.object({
          path: z.string().describe('The path for the secret'),
        }),
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
        method: 'DELETE',
        headers: {
          'X-Vault-Token': vaultToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vault delete request failed: ${response.status} ${errorText}`);
      }
    },
  });
}