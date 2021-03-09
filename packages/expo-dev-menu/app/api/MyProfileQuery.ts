import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';

export type Profile = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string;
  isLegacy: boolean;
  appCount: number;
};

interface MyProfileData {
  me: Profile;
}

interface MyProfileVars {}

const MyProfileQuery = gql`
  query Home_MyProfile {
    me {
      id
      appCount
      email
      firstName
      isLegacy
      lastName
      profilePhoto
      username
    }
  }
`;

export function useMyProfileQuery() {
  const query = useQuery<MyProfileData, MyProfileVars>(MyProfileQuery, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    ...query,
    data: {
      user: query.data?.me,
    },
  };
}
