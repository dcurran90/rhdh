import { makeStyles } from '@material-ui/core/styles';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { useApi, discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import { useEffect, useState } from 'react';


const useStyles = makeStyles({
  avatar: {
    height: 32,
    width: 32,
    borderRadius: '50%',
  },
});

type VaultMount = {
  [path: string]: {
    type: string;
  }
}
type VaultItem = {
  path: string;
  key: string;
  value: string;
  version: string;
  createdBy: string;
  createdAt: string;
}

type DenseTableProps = {
  items: VaultMount[];
};

export const DenseTable = ({ items }: DenseTableProps) => {
  const classes = useStyles();
  const [selectedMount, setSelectedMount] = useState<string | null>(null);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  useEffect(() => {
    if (selectedMount) {


      console.log('In UseEffect')
      const fetchSecrets = async () => {
        try {
          const baseUrl = await discoveryApi.getBaseUrl('rhdh-vault');
          const response = await fetchApi.fetch(`${baseUrl}/secret/${selectedMount}`);
          const result = await response.json();

          console.log('Fetched secret path:', result);
          for(var secPath of result) {
            console.log('getting secret path ', secPath) 
            const response = await fetchApi.fetch(`${baseUrl}/secret/${selectedMount}${secPath}`);
            const kvResult = await response.json();

            console.log('Fetched secrets:', kvResult);
          }
        } catch (error) {
          console.error('Failed to fetch secrets:', error);
        }
      };

      fetchSecrets();

      // ✅ Run your fetch or API call here
      // fetch(`/api/my-plugin/secrets?path=${selectedMount}`)
      //   .then(res => res.json())
      //   .then(data => {
      //     console.log('Fetched secrets:', data);
      //   })
      //   .catch(err => {
      //     console.error('Failed to fetch secrets', err);
      //   });
    }
  }, [selectedMount]);

  const mountTableColumns: TableColumn[] = [
    { title: 'path', field: 'path' },
    { title: 'type', field: 'type' },
  ]

  const secretTableColumns: TableColumn[] = [
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

      {selectedMount && (

        <Table
          title="Vault Secrets"
          options={{ search: false, paging: false }}
          columns={secretTableColumns}
          data={data}
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