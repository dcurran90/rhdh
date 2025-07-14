import { makeStyles } from '@material-ui/core/styles';
import {
  Table,
  TableColumn,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import useAsync from 'react-use/lib/useAsync';
import { useApi, discoveryApiRef, fetchApiRef } from '@backstage/core-plugin-api';


const useStyles = makeStyles({
  avatar: {
    height: 32,
    width: 32,
    borderRadius: '50%',
  },
});

export const exampleUsers = {
  results: [
    {
      gender: 'female',
      name: {
        title: 'Miss',
        first: 'Carolyn',
        last: 'Moore',
      },
      email: 'carolyn.moore@example.com',
      picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Carolyn',
      nat: 'GB',
    },
    {
      gender: 'female',
      name: {
        title: 'Ms',
        first: 'Esma',
        last: 'Berberoğlu',
      },
      email: 'esma.berberoglu@example.com',
      picture: 'https://api.dicebear.com/6.x/open-peeps/svg?seed=Esma',
      nat: 'TR',
    },
  ],
};

type VaultItem = {
  title: string;
  id: string;
  createdBy: string;
  createdAt: string;
}


type User = {
  gender: string; // "male"
  name: {
    title: string; // "Mr",
    first: string; // "Duane",
    last: string; // "Reed"
  };
  email: string; // "duane.reed@example.com"
  picture: string; // "https://api.dicebear.com/6.x/open-peeps/svg?seed=Duane"
  nat: string; // "AU"
};

type DenseTableProps = {
  items: VaultItem[];
};

export const DenseTable = ({ items }: DenseTableProps) => {
  const classes = useStyles();

  const columns: TableColumn[] = [
    { title: 'title', field: 'title' },
    { title: 'id', field: 'id' },
    { title: 'Created By', field: 'createdBy' },
    { title: 'Created At', field: 'createdAt' },
  ];

  const data = items
  // items.map(item => {
  //   return {
  //     title: `${item.title}`,
  //     id: item.id,
  //     createdBy: item.createdBy,
  //     createdAt: item.createdAt
  //   };
  // });

  return (
    <Table
      title="Example Todo List"
      options={{ search: false, paging: false }}
      columns={columns}
      data={data}
    />
  );
};

// export const ExampleFetchComponentOLD = () => {

//   const { value, loading, error } = useAsync(async (): Promise<User[]> => {
//     // Would use fetch in a real world example
//     return exampleUsers.results;
//   }, []);

//   if (loading) {
//     return <Progress />;
//   } else if (error) {
//     return <ResponseErrorPanel error={error} />;
//   }

//   return <DenseTable users={value || []} />;
// };


export const ExampleFetchComponent = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const { value, loading, error } = useAsync(async (): Promise<VaultItem[]> => {
    const baseUrl = await discoveryApi.getBaseUrl('rhdh-vault');
    const response = await fetchApi.fetch(`${baseUrl}/secrets`);

    console.log("DAN1")
    console.log(`${baseUrl}/secrets`)
    if (!response.ok) {
      throw new Error(`Failed to fetch secrets: ${response.statusText}`);
    }
    const data = await response.json();

    // Adapt the response shape if needed
    return data.secrets || []; // 👈 assume your backend returns { secrets: [...] }
  }, []);

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;

  return <DenseTable items={value || []} />;
};