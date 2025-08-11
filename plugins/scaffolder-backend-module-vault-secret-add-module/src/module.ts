import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createVaultSecretAction } from './vaultSecretAddAction';
import { getVaultSecretAction } from './vaultSecretGetAction';
import { deleteVaultSecretAction } from './vaultSecretDeleteAction';


export const scaffolderModuleVaultSecretGetModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'vault-secret-get-module',
  register(reg) {
    reg.registerInit({
      deps: { 
        scaffolderActions: scaffolderActionsExtensionPoint,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
       },
      async init({ scaffolderActions, logger, config }) {
        // if you want to use any of core features, pass it to the action below
        scaffolderActions.addActions(getVaultSecretAction( config ));
        logger.info('vault-secret-add action registered');
      },
    });
  },
});

export const scaffolderModuleVaultSecretAddModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'vault-secret-add-module',
  register(reg) {
    reg.registerInit({
      deps: { 
        scaffolderActions: scaffolderActionsExtensionPoint,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
       },
      async init({ scaffolderActions, logger, config }) {
        // if you want to use any of core features, pass it to the action below
        scaffolderActions.addActions(createVaultSecretAction( config ));
        logger.info('vault-secret-add action registered');
      },
    });
  },
});

export const scaffolderModuleVaultSecretDeleteModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'vault-secret-delete-module',
  register(reg) {
    reg.registerInit({
      deps: { 
        scaffolderActions: scaffolderActionsExtensionPoint,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
       },
      async init({ scaffolderActions, logger, config }) {
        // if you want to use any of core features, pass it to the action below
        scaffolderActions.addActions(deleteVaultSecretAction( config ));
        logger.info('vault-secret-delete action registered');
      },
    });
  },
});