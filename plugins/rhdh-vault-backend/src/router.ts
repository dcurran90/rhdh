import { HttpAuthService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';
import Router from 'express-promise-router';
import { VaultItem, VaultService } from './services/VaultService/types';

export async function createRouter({
  httpAuth,
  vaultService,
}: {
  httpAuth: HttpAuthService;
  vaultService: VaultService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  // TEMPLATE NOTE:
  // Zod is a powerful library for data validation and recommended in particular
  // for user-defined schemas. In this case we use it for input validation too.
  //
  // If you want to define a schema for your API we recommend using Backstage's
  // OpenAPI tooling: https://backstage.io/docs/next/openapi/01-getting-started
  const secretSchema = z.object({
    path: z.string(),
    entityRef: z.string().optional(),
  });

  router.post('/secrets', async (req, res) => {
    const parsed = secretSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new InputError(parsed.error.toString());
    }

    const result = await vaultService.createVaultItem(parsed.data, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    res.status(201).json(result);
  });

  router.get('/secrets', async (_req, res) => {
    res.json(await vaultService.listVaultSecrets());
  });

  router.get('/secret/:id', async (req, res) => {
    res.json(await vaultService.getVaultSecret({ mountPath: 'secret', secretPath: 'hello' }));
  });

  return router;
}
