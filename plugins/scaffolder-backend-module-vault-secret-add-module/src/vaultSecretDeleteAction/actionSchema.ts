export const actionSchema = {
  input: {
    type: 'object',
    required: ['path', 'key', 'value'],
    properties: {
      path: {
        title: 'path',
        description: 'This is the path for the secret being created',
        type: 'string',
      }
    },
  },
};