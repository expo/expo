export type Experience = {
  __typename: string;
  id?: string;
  name?: string;
  slug?: string;
  fullName?: string;
  username?: string;
  published?: string;
  description?: string;
  githubUrl?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  sdkVersion?: string;
  iconUrl?: string;
  privacy?: string;
  icon?: {
    url?: string;
    primaryColor?: string;
    colorPalette?: string;
  };
};

export type Viewer = {
  email?: string;
  id: string;
  username: string;
  profilePhoto: string;
  isExpoAdmin: boolean;
  appetizeCode: string;
  firstName?: string;
  lastName?: string;
};
