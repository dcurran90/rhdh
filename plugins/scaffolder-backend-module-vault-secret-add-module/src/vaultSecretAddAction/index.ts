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

      // logger.info(`user created successfully: ${ctx}`);


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
  });
}


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
//   });
// }