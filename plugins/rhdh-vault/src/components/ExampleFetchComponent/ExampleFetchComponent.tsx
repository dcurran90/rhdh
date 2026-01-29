import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { useApi, discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { useEffect, useState } from 'react';

type VaultMount = {
  [path: string]: {
    type: string;
  }
}

type DenseTableProps = {
  items: VaultMount[];
};

export const DenseTable = ({ items }: DenseTableProps) => {
  const [selectedMount, setSelectedMount] = useState<string | null>(null);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
const [vaultSecrets, setVaultSecrets] = useState<{ path: string, key: string; value: string }[]>([]);

  useEffect(() => {
    if (selectedMount) {
      const fetchSecrets = async () => {
        try {
          const baseUrl = await discoveryApi.getBaseUrl('rhdh-vault');
          const response = await fetchApi.fetch(`${baseUrl}/secret/${selectedMount}`);
          const result = await response.json();

          for(var secPath of result) {
            const response = await fetchApi.fetch(`${baseUrl}/secret/${selectedMount}${secPath}`);
            const kvResult = await response.json();
            console.log('Fetched secrets:', kvResult.secrets);

            for(var pair of kvResult.secrets) {

              const newSecret = {
                path: secPath,
                key: pair.key,
                value: pair.value
              }
              setVaultSecrets([...vaultSecrets, newSecret])
              console.log('Fetched secret pair:', pair);
            }
          }


        } catch (error) {
          console.error('Failed to fetch secrets:', error);
        }
      };

      fetchSecrets();

    }
  }, [selectedMount]);

  const mountTableColumns: TableColumn[] = [
    { title: 'path', field: 'path' },
    { title: 'type', field: 'type' },
  ]

  const secretTableColumns: TableColumn[] = [
    { title: 'path', field: 'path'},
    { title: 'key', field: 'key' },
    { title: 'value', field: 'value' },
  ]

  const data = items.flatMap(item =>
    Object.entries(item).map(([path, item]) => {
      return {
        path: path,
        type: item.type,
      };
    }));

    // const vaultSecretData = vaultSecrets.flatMap(item =>
    // Object.entries(item).map(([path, item]) => {
    //   return {
    //     key: path,
    //     value: item.type,
    //   };
    // }));

  return (

    <>
      <Table
        title="Vault Mounts"
        options={{ search: false, paging: false }}
        columns={mountTableColumns}
        data={data}
        onRowClick={(_, rowData) => {
          if (rowData && 'path' in rowData) {
            setSelectedMount(rowData['path'] as string)
          }
        }}
      />

      <br />

      {selectedMount && vaultSecrets &&  (
        <Table
          title="Vault Secrets"
          options={{ search: false, paging: false }}
          columns={secretTableColumns}
          data={vaultSecrets}
        />
      )}

    </>
  );
};

export const ExampleFetchComponent = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const { value, loading, error } = useAsync(async (): Promise<VaultMount[]> => {
    const baseUrl = await discoveryApi.getBaseUrl('rhdh-vault');
    const response = await fetchApi.fetch(`${baseUrl}/secrets`);

    if (!response.ok) {
      throw new Error(`Failed to fetch secrets: ${response.statusText}`);
    }
    const data = await response.json();
    // Adapt the response shape if needed
    return data.mounts || [];
  }, []);

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;

  return <DenseTable items={value || []} />;
};