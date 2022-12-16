import { gql } from 'graphql-request';

import { apiClient } from '../apiClient';

export type UserData = {
  id: string;
  appCount: number;
  email: string;
  username: string;
  profilePhoto: string;
  accounts: UserAccount[];
  isExpoAdmin: boolean;
};

export type UserAccount = {
  id: string;
  name: string;
  owner?: {
    username: string;
    fullName?: string;
    profilePhoto?: string;
  };
};

const query = gql`
  {
    me {
      id
      appCount
      email
      profilePhoto
      username
      isExpoAdmin

      accounts {
        id
        name
        owner {
          username
          fullName
          profilePhoto
        }
      }
    }
  }
`;

export async function getUserProfileAsync() {
  return apiClient.request(query).then((data) => data.me as UserData);
}
