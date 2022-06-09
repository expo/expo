export type ModalStackRoutes = {
  QRCode: undefined;
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
};

export type DiagnosticsStackRoutes = {
  Diagnostics: object;
  Audio: object;
  Location: object;
  Geofencing: object;
};
