import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const rhdhVaultPlugin = createPlugin({
  id: 'rhdh-vault',
  routes: {
    root: rootRouteRef,
  },
});

export const RhdhVaultPage = rhdhVaultPlugin.provide(
  createRoutableExtension({
    name: 'RhdhVaultPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
