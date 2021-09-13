import ApolloClient from '../api/ApolloClient';
import {
  Home_ViewerUsernameDocument,
  Home_ViewerUsernameQuery,
  Home_ViewerUsernameQueryVariables,
} from '../graphql/types';
import Store from '../redux/Store';

export default async function getViewerUsernameAsync(): Promise<string | null> {
  const { sessionSecret } = Store.getState().session;
  if (!sessionSecret) {
    return null;
  }

  const result = await ApolloClient.query<
    Home_ViewerUsernameQuery,
    Home_ViewerUsernameQueryVariables
  >({
    query: Home_ViewerUsernameDocument,
  });

  const { data } = result;
  if (!data.me) {
    return null;
  }
  return data.me.username;
}
