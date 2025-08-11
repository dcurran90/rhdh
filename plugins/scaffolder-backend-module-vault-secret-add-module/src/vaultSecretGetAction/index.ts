import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';

export function getVaultSecretAction(config: Config) {
  return createTemplateAction({
    id: 'vault:get-secret',
    description: 'get a secret from vault',
    schema: {
      input: (z) =>
        z.object({
          path: z.string().describe('The path for the secret'),
          key: z.string().describe('The key for the secret'),
          value: z.string().describe('The value for the secret'),
        }),
    },
    async handler(ctx) {

      const vaultUrl = config.getString('rhdhVault.baseUrl');
      const vaultToken = config.getString('rhdhVault.token');
      const vaultPathArray = ctx.input.path.split("/")
      if (vaultPathArray.length != 2) throw new Error('path must be "<mount>/<secret>"');

      const vaultKey = ctx.input.key
      const vaultValue = ctx.input.value
      const payload = {
        data: { [vaultKey]: vaultValue },       // single k/v from your template input
      };
      if (!vaultToken) {
        throw new Error('Missing vault token configuration');
      }

      const response = await fetch(`${vaultUrl}/v1/${vaultPathArray[0]}/data/${vaultPathArray[1]}`, {
        method: 'POST',
        headers: {
          'X-Vault-Token': vaultToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const responseClone = response.clone();
      const myJSON = await responseClone.json();
      console.log('JSON Body:', myJSON);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vault mounts request failed: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      return { secrets: data };
    },
  });
}