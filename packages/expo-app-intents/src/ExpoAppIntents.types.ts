/**
 * A single recorded App Intent invocation. Invocations are persisted natively until
 * removed with `removePendingInvocationAsync`, so delivery is at-least-once and handlers
 * must be idempotent per `id`.
 */
export type AppIntentInvocation = {
  /** Unique identifier of this invocation. Use it to remove the invocation after handling. */
  id: string;
  /** The invocation name passed to `await AppIntentDispatcher.shared.dispatch(name:params:)` in Swift. */
  name: string;
  /** Parameters passed from the native intent. */
  params: Record<string, unknown>;
  /** Unix timestamp in milliseconds at which the intent ran. */
  createdAt: number;
};

/**
 * Handles a snapshot of pending invocations and, after the initial call, the new invocation
 * that triggered this handler call.
 */
export type AppIntentsHandler = (
  pendingIntents: AppIntentInvocation[],
  newIntent: AppIntentInvocation | null
) => void | Promise<void>;

/**
 * An entity exposed to App Intents parameter queries, for example a dish the user can
 * name when talking to Siri.
 */
export type AppIntentEntity = {
  /** Stable unique identifier. */
  id: string;
  /** Display name shown by Siri and the Shortcuts app, and matched against speech. */
  title: string;
  /** Optional secondary text shown in disambiguation UI. */
  subtitle?: string;
  /** Alternative spoken names that resolve to this entity. */
  synonyms?: string[];
};

export type ExpoAppIntentsModuleEvents = {
  onIntent: (invocation: AppIntentInvocation) => void;
};
