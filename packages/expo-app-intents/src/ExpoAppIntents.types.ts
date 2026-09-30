// A type-only import, so nothing from ExpoUI is pulled in at runtime on the platforms where App
// Intents do not exist.
import type { ModifierConfig } from '@expo/ui/swift-ui/modifiers';

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
  /** App-specific string metadata consumed by native AppEntity implementations. */
  metadata?: Record<string, string>;
  /**
   * Whether to keep this entity out of the Spotlight index. It stays resolvable, so Siri can still
   * offer it as a parameter and open it by identifier — it just is not searchable.
   *
   * Only applies to entities registered natively with `registerIndexed`. Defaults to `false`.
   *
   * @platform ios
   */
  hideInSpotlight?: boolean;
};

/**
 * ExpoUI modifier config that associates a SwiftUI view with an AppEntity identifier.
 *
 * Built on `@expo/ui`'s own `ModifierConfig` rather than restating its shape, so that a change to
 * what the `modifiers` prop accepts is a type error here instead of a value ExpoUI rejects at
 * runtime.
 */
export type AppEntityIdentifierModifier = ModifierConfig & {
  $type: 'appEntityIdentifier';
  /** App-specific entity kind registered natively, for example `person` or `dish`. */
  entity: string;
  /** Stable entity id from the matching App Intents entity catalog. */
  id: string;
};

export type ExpoAppIntentsModuleEvents = {
  onIntent: (invocation: AppIntentInvocation) => void;
};
