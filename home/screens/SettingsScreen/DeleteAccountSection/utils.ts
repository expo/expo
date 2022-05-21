import { ApolloClient } from '@apollo/client';
import ApiV2HttpClient from 'api/ApiV2HttpClient';
import { UserPermissionDataFragment, Permission } from 'graphql/types';

export const handleAccountDeleteAsync = async (
  apiV2Client: ApiV2HttpClient,
  client: ApolloClient<any>,
  clearSessionSecretData: () => void,
  password: string,
  otp?: string
) => {
  await apiV2Client.postAsync('auth/delete-user', {
    notify: true,
    otp,
    password,
  });

  if (client) {
    client.clearStore();
  }
  clearSessionSecretData();
};

export type AccountRequiredShape = {
  owner?: { username: string } | null;
  users: {
    user?: { username: string } | null;
    permissions: UserPermissionDataFragment['permissions'];
  }[];
};

export function memberHasPermission(
  account: AccountRequiredShape,
  username: string,
  permission: Permission
) {
  return Boolean(
    account.users?.find(
      (member) => member?.user?.username === username && member?.permissions?.includes(permission)
    )
  );
}
