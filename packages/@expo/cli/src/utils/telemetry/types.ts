import { type Actor } from '../../api/user/user';

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

export interface TelemetryClient {
  /** Determine if the telemetry client is identified */
  readonly isIdentified: boolean;
  /** Identify the current actor */
  identify(actor?: Actor): Promise<void>;
  /** Record a (custom) event */
  record(event: TelemetryEvent, properties?: TelemetryProperties): Promise<void>;
  /** Clear the record queue and send all recorded events */
  flush(): Promise<void>;
}
