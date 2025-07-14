import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { createVaultService } from './services/VaultService';
import express from 'express';


/**
 * rhdhVaultPlugin backend plugin
 *
 * @public
 */
export const rhdhVaultPlugin = createBackendPlugin({
  pluginId: 'rhdh-vault',
  register(env) {

    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        rootHttpRouter: coreServices.rootHttpRouter,
        catalog: catalogServiceRef,
        config: coreServices.rootConfig,
      },
      async init({ logger, httpAuth, httpRouter, rootHttpRouter, catalog, config }) {
        const vaultService = await createVaultService({
          logger,
          catalog,
          config,
        });



        const publicRouter = express.Router();
        publicRouter.get('/ping', async (req, res) => {

          try {
            const { secrets } = await vaultService.getVaultSecret({ mountPath: 'secret', secretPath: 'hello' });
            res.json({ secrets });
          } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            res.status(500).json({ error: message });
          }

          // res.json(await vaultService.getVaultSecret(req));
          // res.json({ status: '✅ rhdh-vault-backend is alive (public danss)' });
        });
        rootHttpRouter.use('/api/rhdh-vault-test', publicRouter); // No auth on this one

        httpRouter.use(
          await createRouter({
            httpAuth,
            vaultService,
          }),
        );
      },
    });
  },
});
