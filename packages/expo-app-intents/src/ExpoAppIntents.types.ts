/**
 * A single recorded App Intent invocation.
 *
 * The native layer persists each invocation until `removePendingInvocationAsync` removes it.
 * Delivery is at-least-once, so handlers must be idempotent for each `id`.
 */
export type AppIntentInvocation = {
  /**
   * Identifies this invocation. Callers use the value to remove the invocation after handling it.
   */
  id: string;
  /**
   * Contains the invocation name passed to
   * `await AppIntentDispatcher.shared.dispatch(name:params:)` in Swift.
   */
  name: string;
  /**
   * Contains the parameters passed from the native intent.
   */
  params: Record<string, unknown>;
  /**
   * Indicates when the intent ran as a Unix timestamp in milliseconds.
   */
  createdAt: number;
};

/**
 * Handles a snapshot of pending invocations. After the initial call, it also receives the new
 * invocation that triggered the handler.
 */
export interface AppIntentsHandler {
  (
    pendingIntents: AppIntentInvocation[],
    newIntent: AppIntentInvocation | null
  ): void | Promise<void>;
}

/**
 * Represents an entity exposed to App Intents parameter queries.
 */
export type AppIntentEntity = {
  /**
   * Identifies the entity with a stable value.
   */
  id: string;
  /**
   * Specifies the display name that Siri and the Shortcuts app show and match against speech.
   */
  title: string;
  /**
   * Specifies optional secondary text for the disambiguation UI.
   */
  subtitle?: string;
  /**
   * Provides alternative spoken names that resolve to this entity.
   */
  synonyms?: string[];
};

export type ExpoAppIntentsModuleEvents = {
  onIntent: (invocation: AppIntentInvocation) => void;
};
