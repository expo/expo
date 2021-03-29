import { useQuery } from '@apollo/client';
import { StackScreenProps } from '@react-navigation/stack';
import gql from 'graphql-tag';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import AccountView from '../components/AccountView';
import { Project } from '../components/ProjectList';
import { Snack } from '../components/SnackList';
import { useDispatch } from '../redux/Hooks';
import SessionActions from '../redux/SessionActions';

const APP_LIMIT = 7;
const SNACK_LIMIT = 4;

export interface AccountData {
  account: {
    byName: {
      id: string;
      name: string;
      owner: {
        id: string;
        username: string;
        firstName: string | null;
        lastName: string | null;
        profilePhoto: string;
      } | null;
      appCount: number;
      apps: Project[];
      snacks: Snack[];
    };
  };
}

interface AccountVars {
  accountName: string;
}

const AccountDataQuery = gql`
  query Home_AccountData($accountName: String!) {
    account {
      byName(accountName: $accountName) {
        id
        name
        owner {
          id
          username
          firstName
          lastName
          profilePhoto
        }
        appCount
        apps(limit: ${APP_LIMIT}, offset: 0) {
          id
          fullName
          name
          iconUrl
          packageName
          username
          description
          sdkVersion
          lastPublishedTime
        }
        snacks(limit: ${SNACK_LIMIT}, offset: 0) {
          name
          description
          fullName
          slug
          isDraft
        }
      }
    }
  }
`;

export default function Account(
  props: {
    accountName: string;
    isAuthenticated: boolean;
    isCurrentUsersPersonalAccount: boolean;
  } & StackScreenProps<AllStackRoutes, 'Account'>
) {
  const dispatch = useDispatch();
  const query = useQuery<AccountData, AccountVars>(AccountDataQuery, {
    fetchPolicy: 'cache-and-network',
    variables: {
      accountName: props.accountName.replace('@', ''),
    },
  });
  const { loading, error, data } = query;

  // We verify that the viewer is logged in when we receive data from the server; if the viewer
  // isn't logged in, we clear our locally stored credentials
  React.useEffect(() => {
    if (!loading && !error && props.isCurrentUsersPersonalAccount && !data?.account.byName) {
      dispatch(SessionActions.signOut());
    }
  }, [loading, error, data?.account.byName]);

  return <AccountView {...props} {...query} />;
}
