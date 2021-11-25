import { GraphQLClient } from 'graphql-request';

export const apiEndpoint = `https://staging.exp.host/--/graphql`;
export const websiteOrigin = 'https://staging.expo.dev';

export const apiClient = new GraphQLClient(apiEndpoint);

export function setSessionHeader(sessionSecret: string) {
  apiClient.setHeader('expo-session', sessionSecret);
}
