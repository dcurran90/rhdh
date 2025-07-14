import {
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';

export interface VaultItem {
  path: string;
  key: string;
  value: string;
  version: string;
  createdBy: string;
  createdAt: string;
}

export interface VaultService {
  createVaultItem(
    input: {
      path: string;
      entityRef?: string;
    },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
    },
  ): Promise<VaultItem>;

  listVaultSecretsOLD(): Promise<{ secrets: VaultItem[] }>;
  listVaultSecrets(): Promise<{ secrets: VaultItem[] }>;

  getVaultSecret(request: { mountPath: string, secretPath: string }): Promise<{secrets: VaultItem[]}>;
}
