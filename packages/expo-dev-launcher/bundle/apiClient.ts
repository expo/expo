import { GraphQLClient } from 'graphql-request';

export const apiEndpoint = `https://exp.host/--/graphql`;
export const websiteOrigin = 'https://expo.dev';

export const apiClient = new GraphQLClient(apiEndpoint);
