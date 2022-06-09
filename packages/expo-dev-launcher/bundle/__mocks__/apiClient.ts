import { GraphQLClient } from 'graphql-request';

export const apiEndpoint = `https://exp.host/--/graphql`;
export const websiteOrigin = 'https://expo.dev';
export const restEndpoint = `https://exp.host/--/api/v2`;

export const apiClient = new GraphQLClient(apiEndpoint);

export const restClient = jest.fn().mockResolvedValue({ data: [] });
export const setSessionAsync = jest.fn().mockResolvedValue(null);
