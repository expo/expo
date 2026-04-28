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
     * When `false`, any pending metrics are marked as sent without being dispatched
     * and no further metrics are dispatched until this is set back to `true`.
     *
     * When unset, defaults to `false` for debug builds and `true` for release builds
     * so dev metrics aren't shipped without explicit opt-in.
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
//# sourceMappingURL=types.d.ts.map