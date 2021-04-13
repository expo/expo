import { useQuery } from '@apollo/client';
import { StackScreenProps } from '@react-navigation/stack';
import gql from 'graphql-tag';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import AccountView from '../components/AccountView';
import { Project } from '../components/ProjectList';
import { Snack } from '../components/SnackList';

const APP_LIMIT = 7;
const SNACK_LIMIT = 4;

export interface AccountData {
  account: {
    byName: {
      id: string;
      name: string;
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
          published
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
  } & StackScreenProps<AllStackRoutes, 'Account'>
) {
  const query = useQuery<AccountData, AccountVars>(AccountDataQuery, {
    fetchPolicy: 'cache-and-network',
    variables: {
      accountName: props.accountName,
    },
  });
  return <AccountView {...props} {...query} />;
}
