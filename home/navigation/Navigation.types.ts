type ModalStackRoutes = {
  QRCode: object;
};

export type AllStackRoutes = {
  Projects: object;
  Profile: object;
  Account: { accountName: string };
  UserSettings: object;
  ProjectsForAccount: { accountName: string };
  SnacksForAccount: { accountName: string };
  Experience: { username: string; slug: string };
} & ModalStackRoutes;
