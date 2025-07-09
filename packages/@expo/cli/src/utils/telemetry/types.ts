export type TelemetryEvent = 'action';
export type TelemetryProperties = Record<string, any>;
export type TelemetryRecord = {
  event: TelemetryEvent;
  properties?: TelemetryProperties;
};

export type TelemetryClientStrategy = 'instant' | 'detached' | 'debug';

export interface TelemetryClient {
  /** The telemetry client's strategy */
  get strategy(): TelemetryClientStrategy;
  /** Abort all pending records, and return them */
  abort(): TelemetryRecordInternal[];
  /** Record a (custom) event */
  record(record: TelemetryRecordInternal[]): Promise<void> | void;
  /** Clear the record queue and send all recorded events */
  flush(): Promise<void> | void;
}

export type TelemetryRecordInternal = TelemetryRecord & {
  /**
   * The type of telemetry event.
   * This is added automatically by Rudderstack.
   *
   * @see https://github.com/expo/rudder-sdk-node/blob/79c1bef800d94522f293557d7db367fbd3e64d4a/index.ts#L43
   */
  type: 'identify' | 'track' | 'page' | 'screen' | 'group' | 'alias';

  /**
   * When the telemetry event was sent to the server.
   * This is added automatically by Rudderstack.
   *
   * @see https://github.com/expo/rudder-sdk-node/blob/79c1bef800d94522f293557d7db367fbd3e64d4a/index.ts#L370
   */
  sentAt: Date;

  /**
   * A randomly generated message identifier, using the message content.
   * This is added automatically by Rudderstack.
   *
   * @see https://github.com/expo/rudder-sdk-node/blob/79c1bef800d94522f293557d7db367fbd3e64d4a/index.ts#L263
   */
  messageId: string;

  /**
   * The anonymous identifier, generated and cached locally.
   * This cannot be resolved to a single user.
   */
  anonymousId: string;

  /**
   * Additional context of the event, including a locally generated session ID.
   * Session ID cannot be resolved to a single user, but will be the same for a single invocation of the CLI.
   */
  context: Record<'sessionId' | string, any>;

  /**
   * The original timestamp when this event was created.
   * Note, this is only applicable for detached telemetry.
   */
  originalTimestamp?: Date;
};
