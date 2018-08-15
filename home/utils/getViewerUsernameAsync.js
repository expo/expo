import gql from 'graphql-tag';

import ApolloClient from '../api/ApolloClient';

export default async function getViewerUsernameAsync() {
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
