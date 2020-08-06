type ModalStackRoutes = {
  SignIn: object;
  SignUp: object;
  QRCode: object;
};

export type AllStackRoutes = {
  Projects: object;
  Profile: { username?: string };
  UserSettings: object;
  ExploreAndSearch: object;
  ProjectsForUser: { username: string; belongsToCurrentUser?: boolean };
  SnacksForUser: { username: string; belongsToCurrentUser?: boolean };
  Experience: { username: string; slug: string };
} & ModalStackRoutes;
