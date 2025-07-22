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

export interface VaultPath {
  [path: string]: {
    type: string
  }
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

  listVaultSecretPaths(request: { mountPath: string }): Promise<{ keys: string[] }>;
  listVaultMountPaths(): Promise<{ mounts: VaultPath[] }>;
  getVaultSecret(request: { mountPath: string, secretPath: string }): Promise<{ secrets: VaultItem[] }>;
}
