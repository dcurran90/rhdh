import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createVaultSecretAction } from './vaultSecretAddAction';
import { getVaultSecretAction } from './vaultSecretGetAction';
import { deleteVaultSecretAction } from './vaultSecretDeleteAction';

export const scaffolderModuleVaultSecretAddModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'vault-secret-module',
  register(reg) {
    reg.registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
       },
      async init({ scaffolderActions, logger, config }) {
        // Register all three vault actions in a single call
        scaffolderActions.addActions(
          createVaultSecretAction(config),
          getVaultSecretAction(config),
          deleteVaultSecretAction(config),
        );
        logger.info('Vault secret actions registered (add, get, delete)');
      },
    });
  },
});
