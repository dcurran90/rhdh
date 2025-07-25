import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';


export const scaffolderModuleVaultSecretAddModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'vault-secret-add-module',
  register(reg) {
    reg.registerInit({
      deps: { 
        scaffolderActions: scaffolderActionsExtensionPoint,
        logger: coreServices.logger,
       },
      async init({ logger }) {
        logger.info('Hello World!');
      },
    });
  },
});


// export const scaffolderModuleUserAddModule = createBackendModule({
//   pluginId: 'scaffolder',
//   moduleId: 'user-add-module',
//   register(reg) {
//     reg.registerInit({
//       deps: {
//         scaffolderActions: scaffolderActionsExtensionPoint,
//         logger: coreServices.logger,
//       },
//       async init({ scaffolderActions, logger }) {
//         // if you want to use any of core features, pass it to the action below
//         scaffolderActions.addActions(createVaultSecretAction());
//       },
//     });
//   },
// });