import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';

export function createVaultSecretAction(config: Config) {
  return createTemplateAction({
    id: 'vault:add-secret',
    description: 'adds a secret in vault',
    schema: {
      // input: (z) =>
      //   z.object({
      //     path: z.string().describe('The path for the secret'),
      //     key: z.string().describe('The key for the secret'),
      //     value: z.string().describe('The value for the secret'),
      //   }),

      input: {
        path: z => z.string({ description: 'The path for the secret' }),
        key: z => z.string({ description: 'The key for the secret',}),
        value: z => z.string({ description: 'The value for the secret' }),

      },
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


      ctx.logger.info('Writing secret to Vault…');
      ctx.logger.debug(`Mount=${vaultPathArray[0]} Path=${vaultPathArray[1]}`);

      ctx.logger.info("TESTLOG1")
      ctx.logger.info(vaultKey)
      ctx.logger.info(vaultValue)
      ctx.logger.info(vaultUrl)

      ctx.logger.info(`${vaultUrl}/v1/${vaultPathArray[0]}/data/${vaultPathArray[1]}`)

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

      
      ctx.logger.info("TESTLOG2")
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