import { GraphQLClient } from 'graphql-request';

const endpoint = `https://expo.dev`;
export const apiClient = new GraphQLClient(endpoint);
