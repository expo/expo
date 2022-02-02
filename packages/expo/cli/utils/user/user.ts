import gql from 'graphql-tag';

import * as Log from '../../log';
import * as Analytics from '../analytics/rudderstackClient';
import { fetch } from '../fetch-api';
import { graphqlClient } from '../graphql/client';
import { CurrentUserQuery } from '../graphql/generated';
import { UserQuery } from '../graphql/queries/UserQuery';
import { getAccessToken, getSessionSecret, setSessionAsync } from './sessionStorage';

// Re-export, but keep in separate file to avoid dependency cycle
export { getSessionSecret, getAccessToken };

export type Actor = NonNullable<CurrentUserQuery['meActor']>;

let currentUser: Actor | undefined;

export const ANONYMOUS_USERNAME = 'anonymous';

/**
 * Resolve the name of the actor, either normal user or robot user.
 * This should be used whenever the "current user" needs to be displayed.
 * The display name CANNOT be used as project owner.
 */
export function getActorDisplayName(user?: Actor): string {
  switch (user?.__typename) {
    case 'User':
      return user.username;
    case 'Robot':
      return user.firstName ? `${user.firstName} (robot)` : 'robot';
    default:
      return ANONYMOUS_USERNAME;
  }
}

export async function getUserAsync(): Promise<Actor | undefined> {
  if (!currentUser && (getAccessToken() || getSessionSecret())) {
    const user = await UserQuery.currentUserAsync();
    currentUser = user ?? undefined;
    if (user) {
      await Analytics.setUserDataAsync(user.id, {
        username: getActorDisplayName(user),
        user_id: user.id,
        user_type: user.__typename,
      });
    }
  }
  return currentUser;
}

export async function loginAsync(json: {
  username: string;
  password: string;
  otp?: string;
}): Promise<void> {
  const res = await fetch('/auth/loginAsync', {
    method: 'POST',
    body: JSON.stringify(json),
  });
  const {
    data: { sessionSecret },
  } = await res.json();
  const result = await graphqlClient
    .query(
      gql`
        query UserQuery {
          viewer {
            id
            username
          }
        }
      `,
      {},
      {
        fetchOptions: {
          headers: {
            'expo-session': sessionSecret,
          },
        },
        additionalTypenames: [] /* UserQuery has immutable fields */,
      }
    )
    .toPromise();
  const {
    data: { viewer },
  } = result;
  await setSessionAsync({
    sessionSecret,
    userId: viewer.id,
    username: viewer.username,
    currentConnection: 'Username-Password-Authentication',
  });
}

export async function logoutAsync(): Promise<void> {
  currentUser = undefined;
  await setSessionAsync(undefined);
  Log.log('Logged out');
}
