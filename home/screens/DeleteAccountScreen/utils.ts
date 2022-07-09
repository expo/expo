import { ApolloClient } from '@apollo/client';

import { APIV2Client } from '../../api/APIV2Client';
import { UserPermissionDataFragment, Permission } from '../../graphql/types';

export const handleAccountDeleteAsync = async (
  apiV2Client: APIV2Client,
  client: ApolloClient<any>,
  clearSessionSecretData: () => void,
  password: string,
  otp?: string
) => {
  await apiV2Client.sendAuthenticatedApiV2Request('auth/delete-user', {
    body: { notify: true, otp, password },
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
