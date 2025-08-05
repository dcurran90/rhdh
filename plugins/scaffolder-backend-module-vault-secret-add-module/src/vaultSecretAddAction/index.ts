import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

export function createVaultSecretAction() {
  return createTemplateAction({
    id: 'vault:add-secret',
    description: 'adds a secret in vault',
    schema: {
      input: (z) =>
        z.object({
          path: z.string().describe('The path for the secret'),
          key: z.string().describe('The key for the secret'),
          value: z.string().describe('The value for the secret'),
        }),
    },
    async handler(ctx) {

      console.log("DAN1:")
      console.log(JSON.stringify(ctx.input.path, null, 2));

      await fetch('url-to-user-manager-service/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: ctx.input.path,
          key: ctx.input.key,
          value: ctx.input.value,
        }),
      });
    },

//     async createVaultSecret(request: { mountPath: string, secretPath: string }): Promise<{ secrets: VaultItem[] }> {
//       if (!vaultToken) {
//         throw new Error('Missing vault token configuration');
//       }
//       const response = await fetch(`${vaultAddr}/v1/${request.mountPath}/data/${request.secretPath}`, {
//         method: 'GET',
//         headers: {
//           'X-Vault-Token': vaultToken,
//         },
//       });

//       logger.info('Status: ' + response.status);
//       logger.info('Status Text: ' + response.statusText);
//       logger.info('Headers: ' + Object.fromEntries(response.headers.entries()));

//       const responseClone = response.clone();
//       const myJSON = await responseClone.json();
//       console.log('JSON Body:', myJSON);

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Vault mounts request failed: ${response.status} ${errorText}`);
//       }
//       const data = await response.json();

//       logger.info("DAN4")
//       logger.info(JSON.stringify(myJSON, null, 2))
//       return { secrets: data };
//     },
//   });
// }


// export const scaffolderModuleUserAddModule = createBackendModule({
//   pluginId: 'scaffolder',
//   moduleId: 'user-add-module',
//   register(reg) {
//     reg.registerInit({
//       deps: { logger: coreServices.logger },
//       async init({ logger }) {
//         logger.info('Hello World!');
//       },
//     });
//   },
// });


// export function createUserAction(logger: LoggerService) {
//   return createTemplateAction<CreateUserInput>({
//     id: 'usermanager:add-user',
//     description: 'adds a user in user manager',
//     schema: actionSchema,
//     async handler(ctx) {
//       const data = await fetch('url-to-user-manager-service/user', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           username: ctx.input.username,
//           password: ctx.input.password,
//         }),
//       }).then(res => {
//         return res.json();
//       });

//       logger.info(`user created successfully: ${data}`);
//       ctx.output('data', JSON.stringify(data));
//     },
   });
 }