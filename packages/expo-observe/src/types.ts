export type Config = {
  /**
   * The environment for observability events
   *
   * @default process.env.NODE_ENV
   */
  environment?: string;
  /**
   * Whether to enable dispatching events to the server
   *
   * @default true for production, false for development
   */
  dispatchingEnabled?: boolean;
};

export interface ExpoObserveModuleType {
  dispatchEvents(): Promise<void>;
  /**
   * Configures observability settings.
   */
  configure(config: Config): void;
}
