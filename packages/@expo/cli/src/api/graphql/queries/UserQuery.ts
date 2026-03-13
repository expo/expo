import { graphql, query } from '../client';

export type Permission = 'ADMIN' | 'OWN' | 'PUBLISH' | 'VIEW';

type CurrentUserDataUser = {
  permissions: Permission[];
  actor: {
    __typename: 'Robot' | 'SSOUser' | 'User';
    id: string;
  };
};

type CurrentUserDataAccount = {
  __typename?: 'Account';
  id: string;
  users: CurrentUserDataUser[];
};

export type Actor =
  | {
      __typename: 'Robot';
      firstName?: string | null;
      id: string;
      accounts: CurrentUserDataAccount[];
    }
  | {
      __typename: 'SSOUser' | 'User';
      id: string;
      username: string;
      primaryAccount: {
        id: string;
      };
      accounts: CurrentUserDataAccount[];
    };

type CurrentUserData = {
  meActor: Actor | null;
};

const CurrentUserDocument = graphql<CurrentUserData>(`
  query CurrentUser {
    meActor {
      __typename
      id
      ... on UserActor {
        primaryAccount {
          id
        }
        username
      }
      ... on Robot {
        firstName
      }
      accounts {
        id
        users {
          actor {
            __typename
            id
          }
          permissions
        }
      }
    }
  }
`);

type UserQueryData = {
  meUserActor: {
    id: string;
    username: string;
  };
};

const UserQueryDocument = graphql<UserQueryData>(`
  query UserQuery {
    meUserActor {
      id
      username
    }
  }
`);

export const UserQuery = {
  async currentUserAsync() {
    const data = await query(CurrentUserDocument, {});
    return data.meActor;
  },
  async meUserActorAsync(headers: Record<string, string>) {
    const data = await query(UserQueryDocument, {}, { headers });
    return {
      id: data.meUserActor.id,
      username: data.meUserActor.username,
    };
  },
};
