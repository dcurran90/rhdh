import {
  BackstageCredentials,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';

export interface VaultItem {
  title: string;
  id: string;
  createdBy: string;
  createdAt: string;
}

export interface VaultService {
  createVaultItem(
    input: {
      title: string;
      entityRef?: string;
    },
    options: {
      credentials: BackstageCredentials<BackstageUserPrincipal>;
    },
  ): Promise<VaultItem>;

  listVaultSecrets(): Promise<{ items: VaultItem[] }>;

  getVaultSecret(request: { id: string }): Promise<VaultItem>;
}
