type ModalStackRoutes = {
  QRCode: object;
};

export type AllStackRoutes = {
  Projects: object;
  Profile: object;
  ProfileAllProjects: object;
  ProfileAllSnacks: object;
  Account: { accountName: string };
  UserSettings: object;
  ProjectsForAccount: { accountName: string };
  SnacksForAccount: { accountName: string };
  Project: { id: string };
} & ModalStackRoutes;
