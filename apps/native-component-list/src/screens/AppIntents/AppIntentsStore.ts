import AsyncStorage from '@react-native-async-storage/async-storage';

const counterStateKey = 'native-component-list:app-intents:counter';
const latestOrderKey = 'native-component-list:app-intents:latest-order';
const mailDraftsKey = 'native-component-list:app-intents:mail-drafts';

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

export type AppIntentMailDraft = {
  id: string;
  invocationId: string;
  subject: string;
  body: string;
  /** Recipient addresses, flattened from the intent's `[IntentPerson]` parameters. */
  recipients: string[];
  createdAt: number;
};

export type AppIntentRoute = 'counter' | 'order' | 'mail';

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

/**
 * Native sends the recipients as a comma-separated address list, because
 * `IntentPerson` has no JavaScript representation.
 */
function recipientsParam(params: Record<string, unknown>): string[] {
  return (stringParam(params, 'recipients') ?? '')
    .split(',')
    .map((recipient) => recipient.trim())
    .filter(Boolean);
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

export async function getMailDrafts(): Promise<AppIntentMailDraft[]> {
  return readJson<AppIntentMailDraft[]>(mailDraftsKey, []);
}

export async function clearMailDrafts(): Promise<void> {
  await writeJson<AppIntentMailDraft[]>(mailDraftsKey, []);
}

async function recordMailDrafts(invocations: AppIntentInvocationLike[]): Promise<void> {
  if (invocations.length === 0) {
    return;
  }

  const existingDrafts = await getMailDrafts();
  const existingDraftIds = new Set(existingDrafts.map((draft) => draft.id));
  const newDrafts = invocations
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((invocation) => {
      const body = stringParam(invocation.params, 'body') ?? '';
      const subject =
        (stringParam(invocation.params, 'subject') ?? body.slice(0, 40)) || 'No subject';
      return {
        id: stringParam(invocation.params, 'id') ?? invocation.id,
        invocationId: invocation.id,
        subject,
        body,
        recipients: recipientsParam(invocation.params),
        createdAt: invocation.createdAt,
      };
    })
    .filter((draft) => !existingDraftIds.has(draft.id));

  if (newDrafts.length > 0) {
    await writeJson<AppIntentMailDraft[]>(mailDraftsKey, [...newDrafts, ...existingDrafts]);
  }
}

function routeForInvocation(invocation: AppIntentInvocationLike | null): AppIntentRoute | null {
  switch (invocation?.name) {
    case 'increaseCounter':
      return 'counter';
    case 'orderFood':
      return 'order';
    case 'createMailDraft':
      return 'mail';
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
  const mailInvocations = supportedInvocations.filter(
    (invocation) => invocation.name === 'createMailDraft'
  );

  await Promise.all([
    recordCounterInvocations(counterInvocations),
    recordLatestOrder(orderInvocations),
    recordMailDrafts(mailInvocations),
  ]);

  const routeSource =
    newInvocation && routeForInvocation(newInvocation)
      ? newInvocation
      : latestInvocation(supportedInvocations);

  return {
    handledInvocationIds: supportedInvocations.map((invocation) => invocation.id),
    route: routeForInvocation(routeSource),
    routeInvocationId: routeSource?.id,
  };
}
