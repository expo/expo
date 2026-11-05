export type LanguageStatus = 'supported' | 'not-supported';

export type ModulesV2Feature = {
  /** The ID that pages use to refer to the feature, for example in `<LanguageSupport feature="events" />`. */
  id: string;
  /** The feature name as it appears in the support table. */
  name: string;
  /** The status of the feature in Swift. */
  swift: LanguageStatus;
  /**
   * The status of the feature in Kotlin. `undefined` means that the docs don't have the status yet.
   */
  kotlin?: LanguageStatus;
  /** An optional note that appears next to the statuses. */
  note?: string;
};

// The Swift statuses describe `expo-modules-macros` 0.32.0 and the Kotlin statuses describe
// `io.github.expo:expo-modules-v2-react` 0.2.7.
// TODO(@tsapeta): Confirm the Kotlin statuses that are `undefined`.
export const modulesV2Features: ModulesV2Feature[] = [
  { id: 'modules', name: 'Modules', swift: 'supported', kotlin: 'supported' },
  { id: 'functions', name: 'Synchronous functions', swift: 'supported', kotlin: 'supported' },
  {
    id: 'async-functions',
    name: 'Asynchronous functions',
    swift: 'supported',
    kotlin: 'supported',
  },
  { id: 'properties', name: 'Properties', swift: 'supported' },
  { id: 'constants', name: 'Constants', swift: 'supported', kotlin: 'supported' },
  {
    id: 'concurrent-functions',
    name: 'Functions that run off the JavaScript thread',
    swift: 'supported',
    kotlin: 'supported',
  },
  {
    id: 'async-variants',
    name: 'Asynchronous variants of synchronous functions',
    swift: 'supported',
    kotlin: 'not-supported',
  },
  { id: 'events', name: 'Events', swift: 'supported', kotlin: 'supported' },
  {
    id: 'inline-and-blocking-events',
    name: 'Inline and blocking events',
    swift: 'supported',
    kotlin: 'not-supported',
  },
  { id: 'shared-objects', name: 'Shared objects', swift: 'supported' },
  {
    id: 'shared-object-static-members',
    name: 'Static members of shared objects',
    swift: 'supported',
  },
  { id: 'records', name: 'Records', swift: 'supported', kotlin: 'supported' },
  { id: 'enums', name: 'Enums', swift: 'supported', kotlin: 'supported' },
  { id: 'unions', name: 'Unions', swift: 'supported', kotlin: 'not-supported' },
  { id: 'tuples', name: 'Tuples', swift: 'supported' },
  { id: 'closure-arguments', name: 'Closure arguments', swift: 'supported' },
  { id: 'javascript-values', name: 'JavaScript values as arguments', swift: 'supported' },
];

export function getModulesV2Feature(id: string): ModulesV2Feature {
  const feature = modulesV2Features.find(feature => feature.id === id);
  if (!feature) {
    throw new Error(`Unknown Expo Modules API 2.0 feature: "${id}"`);
  }
  return feature;
}
