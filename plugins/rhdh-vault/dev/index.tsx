import { createDevApp } from '@backstage/dev-utils';
import { rhdhVaultPlugin, RhdhVaultPage } from '../src/plugin';

createDevApp()
  .registerPlugin(rhdhVaultPlugin)
  .addPage({
    element: <RhdhVaultPage />,
    title: 'Root Page',
    path: '/rhdh-vault',
  })
  .render();
