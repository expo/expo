import { GraphQLClient } from 'graphql-request';

export const apiEndpoint = __DEV__
  ? `https://staging.exp.host/--/graphql`
  : `https://exp.host/--/graphql`;
export const websiteOrigin = __DEV__ ? 'https://staging.expo.dev' : 'https://expo.dev';

export const apiClient = new GraphQLClient(apiEndpoint);
