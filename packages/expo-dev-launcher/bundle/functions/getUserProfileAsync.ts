import { gql } from 'graphql-request';

import { apiClient } from '../apiClient';

export type UserData = {
  id: string;
  appCount: number;
  username: string;
  profilePhoto: string;
  accounts: UserAccount[];
  isExpoAdmin: boolean;
};

export type UserAccount = {
  id: string;
  name: string;
  ownerUserActor?: {
    username: string;
    fullName?: string;
    profilePhoto: string;
  };
};

const query = gql`
  {
    meUserActor {
      id
      appCount
      profilePhoto
      username
      isExpoAdmin

      accounts {
        id
        name
        ownerUserActor {
          username
          fullName
          profilePhoto
        }
      }
    }
  }
`;

export async function getUserProfileAsync() {
  const data = await apiClient.request(query);
  return data.meUserActor as UserData;
}
