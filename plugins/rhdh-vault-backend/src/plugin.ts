import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { createTodoListService } from './services/TodoListService';
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
      },
      async init({ logger, httpAuth, httpRouter, rootHttpRouter, catalog }) {
        const todoListService = await createTodoListService({
          logger,
          catalog,
        });



        const publicRouter = express.Router();
        publicRouter.get('/ping', (_req, res) => {
          res.json({ status: '✅ rhdh-vault-backend is alive (public dan)' });
        });
        rootHttpRouter.use('/api/rhdh-vault-test', publicRouter); // No auth on this one

        httpRouter.use(
          await createRouter({
            httpAuth,
            todoListService,
          }),
        );
      },
    });
  },
});
