import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppIntentEntity } from 'expo-app-intents';

const counterStateKey = 'native-component-list:app-intents:counter';
const latestOrderKey = 'native-component-list:app-intents:latest-order';
const journalEntriesKey = 'native-component-list:app-intents:journal-entries';

export type AppIntentInvocationLike = {
  id: string;
  name: string;
  params: Record<string, unknown>;
  createdAt: number;
};

export type AppIntentCounterState = {
  count: number;
  lastInvocationId?: string;
  lastIncrementedAt?: number;
};

export type AppIntentOrder = {
  invocationId: string;
  dishId: string;
  dishName: string;
  createdAt: number;
};

export type AppIntentJournalEntry = {
  id: string;
  invocationId: string;
  title: string;
  message: string;
  createdAt: number;
};

export type AppIntentRoute = 'counter' | 'order' | 'journal';

export const appIntentSampleJournalEntries: AppIntentJournalEntry[] = [
  {
    id: 'sample-journal-market-notes',
    invocationId: 'sample-journal-market-notes',
    title: 'Market Notes',
    message: 'Picked up basil, tomatoes, and fresh bread. The corner stall had the first cherries of the season.',
    createdAt: Date.UTC(2026, 5, 30, 8, 20),
  },
  {
    id: 'sample-journal-product-idea',
    invocationId: 'sample-journal-product-idea',
    title: 'Product Idea',
    message: 'A journal entry should move cleanly from the app into Notes with the title preserved and the body intact.',
    createdAt: Date.UTC(2026, 5, 30, 10, 45),
  },
  {
    id: 'sample-journal-coffee-chat',
    invocationId: 'sample-journal-coffee-chat',
    title: 'Coffee Chat',
    message: 'Met with Maya and talked through the next pass on App Intents. The main test is whether the visible entry resolves as an entity.',
    createdAt: Date.UTC(2026, 5, 30, 13, 10),
  },
  {
    id: 'sample-journal-evening-walk',
    invocationId: 'sample-journal-evening-walk',
    title: 'Evening Walk',
    message: 'Took the long route home. Good reminder that small examples are easier to validate when the data feels real.',
    createdAt: Date.UTC(2026, 5, 30, 18, 35),
  },
  {
    id: 'sample-journal-release-check',
    invocationId: 'sample-journal-release-check',
    title: 'Release Check',
    message: 'Before calling the feature done, make sure the entry card has an AppEntity identifier and the native query can hydrate it.',
    createdAt: Date.UTC(2026, 5, 30, 21, 5),
  },
];

export const appIntentDishCatalog = [
  {
    id: 'margherita-pizza',
    title: 'Margherita Pizza',
    subtitle: 'Tomato, mozzarella, basil',
    synonyms: ['margherita', 'pizza'],
  },
  {
    id: 'spaghetti-carbonara',
    title: 'Spaghetti Carbonara',
    subtitle: 'Pasta, egg, pecorino, pancetta',
    synonyms: ['carbonara', 'spaghetti'],
  },
  {
    id: 'lasagna',
    title: 'Lasagna',
    subtitle: 'Bolognese, bechamel, parmesan',
    synonyms: ['lasagne'],
  },
  {
    id: 'tiramisu',
    title: 'Tiramisu',
    subtitle: 'Coffee, mascarpone, cocoa',
    synonyms: ['dessert'],
  },
];

type AppIntentProcessingResult = {
  handledInvocationIds: string[];
  route: AppIntentRoute | null;
  routeInvocationId?: string;
  routeEntryId?: string;
};

const listeners = new Set<() => void>();

export function subscribeToAppIntentState(listener: () => void) {
  listeners.add(listener);
  return {
    remove() {
      listeners.delete(listener);
    },
  };
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : fallback;
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
  emitChange();
}

function stringParam(params: Record<string, unknown>, name: string): string | undefined {
  const value = params[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function latestInvocation(invocations: AppIntentInvocationLike[]): AppIntentInvocationLike | null {
  if (invocations.length === 0) {
    return null;
  }
  return invocations.reduce((latest, invocation) =>
    invocation.createdAt > latest.createdAt ? invocation : latest
  );
}

export async function getCounterState(): Promise<AppIntentCounterState> {
  return readJson<AppIntentCounterState>(counterStateKey, { count: 0 });
}

export async function resetCounterState(): Promise<void> {
  await writeJson<AppIntentCounterState>(counterStateKey, { count: 0 });
}

async function recordCounterInvocations(invocations: AppIntentInvocationLike[]): Promise<void> {
  if (invocations.length === 0) {
    return;
  }

  const current = await getCounterState();
  const latest = latestInvocation(invocations)!;
  await writeJson<AppIntentCounterState>(counterStateKey, {
    count: current.count + invocations.length,
    lastInvocationId: latest.id,
    lastIncrementedAt: latest.createdAt,
  });
}

export async function getLatestOrder(): Promise<AppIntentOrder | null> {
  return readJson<AppIntentOrder | null>(latestOrderKey, null);
}

export async function clearLatestOrder(): Promise<void> {
  await AsyncStorage.removeItem(latestOrderKey);
  emitChange();
}

async function recordLatestOrder(invocations: AppIntentInvocationLike[]): Promise<void> {
  const latest = latestInvocation(invocations);
  if (!latest) {
    return;
  }

  await writeJson<AppIntentOrder>(latestOrderKey, {
    invocationId: latest.id,
    dishId: stringParam(latest.params, 'dishId') ?? 'unknown-dish',
    dishName: stringParam(latest.params, 'dishName') ?? 'Unknown dish',
    createdAt: latest.createdAt,
  });
}

export async function getJournalEntries(): Promise<AppIntentJournalEntry[]> {
  return readJson<AppIntentJournalEntry[]>(journalEntriesKey, []);
}

export async function clearJournalEntries(): Promise<void> {
  await writeJson<AppIntentJournalEntry[]>(journalEntriesKey, []);
}

export async function addSampleJournalEntries(): Promise<AppIntentJournalEntry[]> {
  const existingEntries = await getJournalEntries();
  const existingEntryIds = new Set(existingEntries.map((entry) => entry.id));
  const newEntries = appIntentSampleJournalEntries.filter((entry) => !existingEntryIds.has(entry.id));

  if (newEntries.length === 0) {
    return existingEntries;
  }

  const entries = [...newEntries, ...existingEntries];
  await writeJson<AppIntentJournalEntry[]>(journalEntriesKey, entries);
  return entries;
}

export function journalEntriesToEntityCatalog(
  entries: AppIntentJournalEntry[]
): AppIntentEntity[] {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    subtitle: entry.message,
    synonyms: [],
    metadata: {
      createdAt: String(entry.createdAt),
      invocationId: entry.invocationId,
      message: entry.message,
    },
  }));
}

async function recordJournalEntries(invocations: AppIntentInvocationLike[]): Promise<void> {
  if (invocations.length === 0) {
    return;
  }

  const existingEntries = await getJournalEntries();
  const existingEntryIds = new Set(existingEntries.map((entry) => entry.id));
  const newEntries = invocations
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((invocation) => {
      const message = stringParam(invocation.params, 'message') ?? '';
      const title = (stringParam(invocation.params, 'title') ?? message.slice(0, 40)) || 'Untitled';
      return {
        id: stringParam(invocation.params, 'id') ?? invocation.id,
        invocationId: invocation.id,
        title,
        message,
        createdAt: invocation.createdAt,
      };
    })
    .filter((entry) => !existingEntryIds.has(entry.id));

  if (newEntries.length > 0) {
    await writeJson<AppIntentJournalEntry[]>(journalEntriesKey, [
      ...newEntries,
      ...existingEntries,
    ]);
  }
}

function routeForInvocation(invocation: AppIntentInvocationLike | null): AppIntentRoute | null {
  switch (invocation?.name) {
    case 'increaseCounter':
      return 'counter';
    case 'orderFood':
      return 'order';
    case 'createJournalEntry':
      return 'journal';
    case 'openJournalEntry':
      return 'journal';
    default:
      return null;
  }
}

export async function processAppIntentInvocations(
  pendingInvocations: AppIntentInvocationLike[],
  newInvocation: AppIntentInvocationLike | null
): Promise<AppIntentProcessingResult> {
  const invocations = [...pendingInvocations];
  if (newInvocation && !invocations.some((invocation) => invocation.id === newInvocation.id)) {
    invocations.push(newInvocation);
  }
  const supportedInvocations = invocations.filter((invocation) => routeForInvocation(invocation));

  const counterInvocations = supportedInvocations.filter(
    (invocation) => invocation.name === 'increaseCounter'
  );
  const orderInvocations = supportedInvocations.filter(
    (invocation) => invocation.name === 'orderFood'
  );
  const journalInvocations = supportedInvocations.filter(
    (invocation) => invocation.name === 'createJournalEntry'
  );

  await Promise.all([
    recordCounterInvocations(counterInvocations),
    recordLatestOrder(orderInvocations),
    recordJournalEntries(journalInvocations),
  ]);

  const routeSource =
    newInvocation && routeForInvocation(newInvocation)
      ? newInvocation
      : latestInvocation(supportedInvocations);

  return {
    handledInvocationIds: supportedInvocations.map((invocation) => invocation.id),
    route: routeForInvocation(routeSource),
    routeInvocationId: routeSource?.id,
    routeEntryId:
      routeSource?.name === 'openJournalEntry' ? stringParam(routeSource.params, 'id') : undefined,
  };
}
