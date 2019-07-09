import gql from 'graphql-tag';

import ApolloClient from '../api/ApolloClient';
import Store from '../redux/Store';

export default async function getViewerUsernameAsync(): Promise<string | null> {
  const { sessionSecret } = Store.getState().session;
  if (!sessionSecret) {
    return null;
  }

  const result = await ApolloClient.query({
    query: gql`
      query Home_ViewerUsername {
        me {
          id
          username
        }
      }
    `,
  });

  const { data } = result;
  if (!data.me) {
    return null;
  }
  return data.me.username;
}
