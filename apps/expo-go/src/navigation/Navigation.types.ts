export type ModalStackRoutes = {
  QRCode: undefined;
  RootStack: undefined;
};

export type HomeStackRoutes = {
  Home: undefined;
  ProjectsList: { accountName: string };
  SnacksList: { accountName: string };
  ProjectDetails: { id: string };
  Branches: { appId: string };
  BranchDetails: { appId: string; branchName: string };
  Account: undefined;
  Project: { id: string };
  FeedbackForm: undefined;
};

export type SettingsStackRoutes = {
  Settings: undefined;
  DeleteAccount: { viewerUsername: string };
};

export type DiagnosticsStackRoutes = {
  Diagnostics: object;
  Audio: object;
  Location: object;
  Geofencing: object;
};
