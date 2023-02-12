import { promises as fs } from 'fs';
import gql from 'graphql-tag';

import * as Log from '../../log';
import * as Analytics from '../../utils/analytics/rudderstackClient';
import { getDevelopmentCodeSigningDirectory } from '../../utils/codesigning';
import { graphqlClient } from '../graphql/client';
import { CurrentUserQuery } from '../graphql/generated';
import { UserQuery } from '../graphql/queries/UserQuery';
import { fetchAsync } from '../rest/client';
import { APISettings } from '../settings';
import UserSettings from './UserSettings';

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
  const hasCredentials = UserSettings.getAccessToken() || UserSettings.getSession()?.sessionSecret;
  if (!APISettings.isOffline && !currentUser && hasCredentials) {
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
  const res = await fetchAsync('auth/loginAsync', {
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
  await UserSettings.setSessionAsync({
    sessionSecret,
    userId: viewer.id,
    username: viewer.username,
    currentConnection: 'Username-Password-Authentication',
  });
}

export async function logoutAsync(): Promise<void> {
  currentUser = undefined;
  await Promise.all([
    fs.rm(getDevelopmentCodeSigningDirectory(), { recursive: true, force: true }),
    UserSettings.setSessionAsync(undefined),
  ]);
  Log.log('Logged out');
}
