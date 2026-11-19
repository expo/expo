import { graphql, query } from '../client';

export type Permission = 'ADMIN' | 'OWN' | 'PUBLISH' | 'PUBLISH_PROTECTED' | 'RUN' | 'VIEW';

type CurrentUserDataAccount = {
  __typename?: 'Account';
  id: string;
  viewerUserPermission2: {
    permissions: Permission[];
    effectivePermissions: Permission[];
  };
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
    }
  | {
      __typename: 'PartnerActor';
      id: string;
      username: string;
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
      ... on PartnerActor {
        username
      }
      accounts {
        id
        viewerUserPermission2 {
          permissions
          effectivePermissions
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
