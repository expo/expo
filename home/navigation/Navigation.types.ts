export type ExploreAndSearchRoute = {};
export type ProjectsForUserRoute = { username: string; belongsToCurrentUser?: boolean };
export type SnacksForUserRoute = { username: string; belongsToCurrentUser?: boolean };
export type ProfileRoute = { username?: string };
export type UserSettingsRoute = {};
export type ProjectsRoute = {};

export type ExploreStackRoutes = Pick<
  AllStackRoutes,
  'ExploreAndSearch' | 'Profile' | 'ProjectsForUser' | 'SnacksForUser'
>;

export type ProfileStackRoutes = Pick<
  AllStackRoutes,
  'Profile' | 'UserSettings' | 'ProjectsForUser' | 'SnacksForUser'
>;

export type ModalStackRoutes = {
  SignIn: {};
  SignUp: {};
  QRCode: {};
};

export type AllStackRoutes = {
  Projects: ProjectsRoute;
  Profile: ProfileRoute;
  UserSettings: UserSettingsRoute;
  ExploreAndSearch: ExploreAndSearchRoute;
  ProjectsForUser: ProjectsForUserRoute;
  SnacksForUser: SnacksForUserRoute;
} & ModalStackRoutes;

export type Links = {};
