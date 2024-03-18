export type TelemetryEvent =
  | 'action'
  | 'Open Url on Device'
  | 'Start Project'
  | 'Serve Manifest'
  | 'Serve Expo Updates Manifest'
  | 'dev client start command'
  | 'dev client run command'
  | 'metro config'
  | 'metro debug';

export type TelemetryProperties = Record<string, any>;

export type TelemetryRecord = { event: TelemetryEvent; properties?: TelemetryProperties };
