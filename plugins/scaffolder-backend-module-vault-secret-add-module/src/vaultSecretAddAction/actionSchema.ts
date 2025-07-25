export const actionSchema = {
  input: {
    type: 'object',
    required: ['path', 'key', 'value'],
    properties: {
      path: {
        title: 'path',
        description: 'This is the path for the secret being created',
        type: 'string',
      },
      key: {
        title: 'key',
        description: 'This is the key of the secret being created',
        type: 'string',
      },
      value: {
        title: 'value',
        description: 'This is the value of the secret being created',
        type: 'string',
      },
    },
  },
};