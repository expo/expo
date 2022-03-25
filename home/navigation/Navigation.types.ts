export type ModalStackRoutes = {
  QRCode: undefined;
};

export type ProjectsStackRoutes = {
  Projects: object;
};

export type HomeStackRoutes = {
  Home: undefined;
  RedesignedProjectsList: { accountName: string };
  RedesignedSnacksList: { accountName: string };
  RedesignedProjectDetails: { id: string };
  Branches: { appId: string };
  BranchDetails: { appId: string; branchName: string };
  Account: undefined;
};

export type ProfileStackRoutes = {
  Profile: object;
  ProfileAllProjects: object;
  ProfileAllSnacks: object;
  Account: { accountName: string };
  UserSettings: object;
  ProjectsForAccount: { accountName: string };
  SnacksForAccount: { accountName: string };
  Project: { id: string };
};

export type DiagnosticsStackRoutes = {
  Diagnostics: object;
  Audio: object;
  Location: object;
  Geofencing: object;
};

export type AllStackRoutes = ProfileStackRoutes &
  ProjectsStackRoutes &
  ModalStackRoutes &
  DiagnosticsStackRoutes;
