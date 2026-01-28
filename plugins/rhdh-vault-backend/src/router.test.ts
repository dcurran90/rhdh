import {
  mockCredentials,
  mockErrorHandler,
  mockServices,
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { VaultService } from './services/VaultService/types';

const mockVaultItem = {
  path: 'secret/myapp',
  key: 'api_token',
  value: 'test-token-123',
  version: '1',
  createdBy: mockCredentials.user().principal.userEntityRef,
  createdAt: new Date().toISOString(),
};

describe('createRouter', () => {
  let app: express.Express;
  let vaultService: jest.Mocked<VaultService>;

  beforeEach(async () => {
    vaultService = {
      createVaultItem: jest.fn(),
      listVaultSecretPaths: jest.fn(),
      listVaultMountPaths: jest.fn(),
      getVaultSecret: jest.fn(),
    };
    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      vaultService,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should create a vault secret', async () => {
    vaultService.createVaultItem.mockResolvedValue(mockVaultItem);

    const response = await request(app).post('/secrets').send({
      path: 'secret/myapp',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockVaultItem);
  });

  it('should not allow unauthenticated requests to create a secret', async () => {
    vaultService.createVaultItem.mockResolvedValue(mockVaultItem);

    const response = await request(app)
      .post('/secrets')
      .set('Authorization', mockCredentials.none.header())
      .send({
        path: 'secret/myapp',
      });

    expect(response.status).toBe(401);
  });
});
