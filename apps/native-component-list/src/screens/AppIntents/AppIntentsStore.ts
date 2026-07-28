import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppIntentEntity } from 'expo-app-intents';

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
  /**
   * Ids of the invocations already counted. Delivery is at-least-once, so the same invocation
   * can arrive more than once and must only ever be counted once.
   */
  countedInvocationIds: string[];
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

export const appIntentSampleMailDrafts: AppIntentMailDraft[] = [
  {
    id: 'sample-draft-release-notes',
    invocationId: 'sample-draft-release-notes',
    subject: 'Release notes for review',
    body: 'Draft of the notes for the next release. Skimming for anything that reads as a breaking change before it goes out.',
    recipients: ['maya@example.com'],
    createdAt: Date.UTC(2026, 5, 30, 8, 20),
  },
  {
    id: 'sample-draft-standup-recap',
    invocationId: 'sample-draft-standup-recap',
    subject: 'Standup recap',
    body: 'Short recap of what we covered: the entity catalog is wired up and the shortcut phrases resolve.',
    recipients: ['team@example.com', 'ravi@example.com'],
    createdAt: Date.UTC(2026, 5, 30, 10, 45),
  },
  {
    id: 'sample-draft-design-feedback',
    invocationId: 'sample-draft-design-feedback',
    subject: 'Feedback on the compose screen',
    body: 'Two notes on the compose screen: the recipient chips need more contrast, and the subject field should keep focus.',
    recipients: ['iris@example.com'],
    createdAt: Date.UTC(2026, 5, 30, 13, 10),
  },
  {
    id: 'sample-draft-conference-trip',
    invocationId: 'sample-draft-conference-trip',
    subject: 'Conference travel details',
    body: 'Flights are booked and the hotel is confirmed. Sending the itinerary so nobody has to ask for it twice.',
    recipients: ['travel@example.com'],
    createdAt: Date.UTC(2026, 5, 30, 18, 35),
  },
  {
    id: 'sample-draft-thanks-next-steps',
    invocationId: 'sample-draft-thanks-next-steps',
    subject: 'Thanks and next steps',
    body: 'Thanks for walking through the App Intents setup. Next step is confirming the draft resolves as an entity in Spotlight.',
    recipients: ['sam@example.com'],
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
  /** Ids of every invocation this run applied, which the caller then removes from the queue. */
  handledInvocationIds: string[];
  /**
   * The screen to navigate to, or `null` to leave the user where they are. Only an invocation whose
   * intent opens the app produces a route - see `appIntentHandlers`.
   */
  route: AppIntentRoute | null;
  routeInvocationId?: string;
  routeDraftId?: string;
};

/**
 * How many invocation ids the counter remembers, so its de-duplication list cannot grow
 * without bound. Keep it comfortably above the number of invocations that can queue up while
 * JavaScript is cold.
 *
 * The list holds the newest ids, so the de-duplication window covers the last
 * `maxRememberedInvocationIds` distinct invocations. One case falls outside it: a single run that
 * counts more than that many invocations, whose oldest ids are then dropped from the list, and
 * whose removal from the pending queue also fails. Only then can iOS deliver one of those oldest
 * invocations again and have it counted twice. Raise this number if your intent can be invoked
 * that many times while JavaScript is cold.
 */
const maxRememberedInvocationIds = 100;

const listeners = new Set<() => void>();

/**
 * `useAppIntents` delivers invocations serially, but these updates also run from the example
 * screens. A reset or clear can therefore be requested while the intent handler is still updating
 * state. Every store update below is a read-modify-write over AsyncStorage, so overlapping updates
 * could read the same value and lose a write. This queue runs them one after another.
 *
 * > **Warning**
 * > The wrapped functions are not re-entrant. Calling one of them - `processAppIntentInvocations`,
 * > `resetCounterState`, `clearLatestOrder` or `clearMailDrafts` - from inside an update that is
 * > already running deadlocks the queue permanently, because the inner call waits on a queue tail
 * > that only completes once the outer call returns. Every store function below therefore updates
 * > state through the unwrapped helpers instead. Do the same in code you copy from here: keep the
 * > wrappers at the boundary that the UI and the intent handler call, and never below it.
 */
let stateUpdateQueue: Promise<unknown> = Promise.resolve();

function withSerializedStateUpdate<T>(update: () => Promise<T>): Promise<T> {
  const runUpdate = async () => {
    try {
      return await update();
    } finally {
      // Notify once the whole run has settled. The getters below are unserialized, so emitting
      // per write would let a screen read a half-applied run - a created draft that the same run
      // is about to delete, for example.
      flushChange();
    }
  };
  const result = stateUpdateQueue.then(runUpdate, runUpdate);
  // Swallow the rejection on the queue only, so one failed update cannot block later ones.
  // The caller still sees it through the returned promise.
  stateUpdateQueue = result.catch(() => {});
  return result;
}

export function subscribeToAppIntentState(listener: () => void) {
  listeners.add(listener);
  return {
    remove() {
      listeners.delete(listener);
    },
  };
}

let hasUnflushedChange = false;

function markChanged() {
  hasUnflushedChange = true;
}

function flushChange() {
  if (!hasUnflushedChange) {
    return;
  }
  hasUnflushedChange = false;
  listeners.forEach((listener) => {
    // Keep a failing listener to itself. This runs from the `finally` of
    // `withSerializedStateUpdate`, where a throw would replace the result of an update that
    // already succeeded - so the intent handler would skip dequeuing the invocations it just
    // applied and re-apply them on the next launch. Catching per listener also stops one bad
    // subscriber from hiding the change from the others.
    try {
      listener();
    } catch (error) {
      console.warn(
        'An App Intents state listener threw while handling a store change, so its screen may show stale state. The store update itself succeeded.',
        error
      );
    }
  });
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const value = await AsyncStorage.getItem(key);
  if (!value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(
      `Discarding the stored App Intents state under "${key}" because it is not valid JSON. This example starts again from its default state.`,
      error
    );
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
  markChanged();
}

function stringParam(params: Record<string, unknown>, name: string): string | undefined {
  const value = params[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function stringArrayParam(params: Record<string, unknown>, name: string): string[] {
  const value = params[name];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

/**
 * Native sends the recipients as an array of addresses, because `IntentPerson` has no JavaScript
 * representation. Each address stays whole, so a display name such as "Doe, John" remains one
 * recipient.
 *
 * An invocation queued by a build that sent one comma-separated string is still read, because the
 * pending queue outlives an app update.
 */
function recipientsParam(params: Record<string, unknown>): string[] {
  const value = params.recipients;
  const recipients =
    typeof value === 'string' ? value.split(',') : stringArrayParam(params, 'recipients');
  return recipients.map((recipient) => recipient.trim()).filter(Boolean);
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
  // State written by an older build has no `countedInvocationIds`, so fill in every field.
  const stored = await readJson<Partial<AppIntentCounterState>>(counterStateKey, {});
  return {
    count: stored.count ?? 0,
    countedInvocationIds: stored.countedInvocationIds ?? [],
    lastInvocationId: stored.lastInvocationId,
    lastIncrementedAt: stored.lastIncrementedAt,
  };
}

export async function resetCounterState(): Promise<void> {
  await withSerializedStateUpdate(async () => {
    const { countedInvocationIds } = await getCounterState();
    await writeJson<AppIntentCounterState>(counterStateKey, {
      count: 0,
      countedInvocationIds,
    });
  });
}

async function recordCounterInvocations(invocations: AppIntentInvocationLike[]): Promise<void> {
  if (invocations.length === 0) {
    return;
  }

  const current = await getCounterState();
  const countedIds = new Set(current.countedInvocationIds);
  const newInvocations = invocations.filter((invocation) => {
    if (countedIds.has(invocation.id)) {
      return false;
    }
    countedIds.add(invocation.id);
    return true;
  });
  if (newInvocations.length === 0) {
    return;
  }

  const latest = latestInvocation(newInvocations)!;
  await writeJson<AppIntentCounterState>(counterStateKey, {
    count: current.count + newInvocations.length,
    // Store exactly the ids this run compared against, minus the oldest ones that no longer fit
    // the window. Deduplicate first, so a list written by an older build cannot spend the window
    // on repeats of the same id.
    countedInvocationIds: [...countedIds].slice(-maxRememberedInvocationIds),
    lastInvocationId: latest.id,
    lastIncrementedAt: latest.createdAt,
  });
}

export async function getLatestOrder(): Promise<AppIntentOrder | null> {
  return readJson<AppIntentOrder | null>(latestOrderKey, null);
}

export async function clearLatestOrder(): Promise<void> {
  await withSerializedStateUpdate(async () => {
    await AsyncStorage.removeItem(latestOrderKey);
    markChanged();
  });
}

async function recordLatestOrder(invocations: AppIntentInvocationLike[]): Promise<void> {
  const latest = latestInvocation(invocations);
  if (!latest) {
    return;
  }

  // Ignore a replay of the order already stored, and never let an older invocation overwrite a
  // newer one.
  const current = await getLatestOrder();
  if (current && (current.invocationId === latest.id || current.createdAt >= latest.createdAt)) {
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
  await withSerializedStateUpdate(() => writeJson<AppIntentMailDraft[]>(mailDraftsKey, []));
}

export async function addSampleMailDrafts(): Promise<AppIntentMailDraft[]> {
  const existingDrafts = await getMailDrafts();
  const existingDraftIds = new Set(existingDrafts.map((draft) => draft.id));
  const newDrafts = appIntentSampleMailDrafts.filter((draft) => !existingDraftIds.has(draft.id));

  if (newDrafts.length === 0) {
    return existingDrafts;
  }

  const drafts = [...newDrafts, ...existingDrafts];
  await writeJson<AppIntentMailDraft[]>(mailDraftsKey, drafts);
  return drafts;
}

/**
 * Projects the drafts into the shape the native `MailDraftEntity.init(record:)` reads: the record's
 * title carries the subject and its subtitle carries the body.
 *
 * The recipients are deliberately left out. Nothing native reads them - `init(record:)` builds a
 * draft with no recipients, and `MailDraftEntityQuery` matches on the subject and the body - so
 * publishing them as `synonyms` would only imply that "the draft to Maya" resolves, when it does
 * not.
 */
export function mailDraftsToEntityCatalog(drafts: AppIntentMailDraft[]): AppIntentEntity[] {
  return drafts.map((draft) => ({
    id: draft.id,
    title: draft.subject,
    subtitle: draft.body,
  }));
}

async function recordMailDrafts(invocations: AppIntentInvocationLike[]): Promise<void> {
  if (invocations.length === 0) {
    return;
  }

  const existingDrafts = await getMailDrafts();
  const existingDraftIds = new Set(existingDrafts.map((draft) => draft.id));
  // The stored list is newest first, and this batch is prepended to it, so sort the batch newest
  // first too. A batch that queued up while JavaScript was cold holds several invocations, which
  // would otherwise land oldest first and read as out of order against the drafts below them.
  const newDrafts = invocations
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
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

async function removeMailDrafts(invocations: AppIntentInvocationLike[]): Promise<void> {
  const removedIds = new Set(
    invocations.flatMap((invocation) => stringArrayParam(invocation.params, 'ids'))
  );
  if (removedIds.size === 0) {
    return;
  }

  const existingDrafts = await getMailDrafts();
  const remainingDrafts = existingDrafts.filter((draft) => !removedIds.has(draft.id));
  if (remainingDrafts.length !== existingDrafts.length) {
    await writeJson<AppIntentMailDraft[]>(mailDraftsKey, remainingDrafts);
  }
}

type AppIntentHandlerDescriptor = {
  /** The example screen that shows what this invocation changed. */
  route: AppIntentRoute;
  /**
   * Whether the Swift intent that dispatches this invocation declares `openAppWhenRun`, and so
   * brings the app forward when it runs.
   */
  opensApp: boolean;
};

/**
 * The invocations this example handles.
 *
 * Only an intent that opens the app may navigate. `DeleteDraftIntent` deliberately leaves
 * `openAppWhenRun` out - it finishes inside Siri - so its invocation waits in the pending queue
 * until JavaScript next runs, which is usually a launch the user started themselves. Navigating
 * for it would drop that user on the Mail screen instead of where they were going. The deletion is
 * still applied on that run, so the Mail screen shows the result as soon as it is opened.
 */
const appIntentHandlers: Record<string, AppIntentHandlerDescriptor> = {
  increaseCounter: { route: 'counter', opensApp: true },
  orderFood: { route: 'order', opensApp: true },
  createMailDraft: { route: 'mail', opensApp: true },
  deleteMailDrafts: { route: 'mail', opensApp: false },
  // `.system.open`/`.mail.openDraft` exist to bring the app forward, so this one routes.
  openMailDraft: { route: 'mail', opensApp: true },
};

function handlerForInvocation(
  invocation: AppIntentInvocationLike | null
): AppIntentHandlerDescriptor | undefined {
  return invocation ? appIntentHandlers[invocation.name] : undefined;
}

function routeForInvocation(invocation: AppIntentInvocationLike | null): AppIntentRoute | null {
  return handlerForInvocation(invocation)?.route ?? null;
}

export async function processAppIntentInvocations(
  pendingInvocations: AppIntentInvocationLike[],
  newInvocation: AppIntentInvocationLike | null
): Promise<AppIntentProcessingResult> {
  // Run one handler's updates at a time, so each run reads the state the previous one wrote.
  return withSerializedStateUpdate(() =>
    applyAppIntentInvocations(pendingInvocations, newInvocation)
  );
}

async function applyAppIntentInvocations(
  pendingInvocations: AppIntentInvocationLike[],
  newInvocation: AppIntentInvocationLike | null
): Promise<AppIntentProcessingResult> {
  const invocations = [...pendingInvocations];
  if (newInvocation && !invocations.some((invocation) => invocation.id === newInvocation.id)) {
    invocations.push(newInvocation);
  }
  const supportedInvocations = invocations.filter((invocation) => handlerForInvocation(invocation));
  const unrecognizedInvocations = invocations.filter(
    (invocation) => !handlerForInvocation(invocation)
  );

  if (unrecognizedInvocations.length > 0) {
    // The pending queue is UserDefaults-backed and holds at most 100 entries, so an invocation this
    // build has no handler for - one queued by an older build whose intent was renamed or removed,
    // for example - must still be dequeued. Leaving it in place would re-read it on every launch
    // and occupy a queue slot until newer invocations eventually displace it.
    //
    // > **Warning**
    // > Dropping it is only safe because this example registers a single `useAppIntents` handler,
    // > which therefore owns every invocation. If you copy this code into an app with several
    // > handlers, do not dequeue an invocation you do not recognize: another handler probably owns
    // > it, and dequeuing it here means that handler never sees it. Handle the names you own and
    // > leave the rest pending.
    console.warn(
      `Dropping ${unrecognizedInvocations.length} pending App Intent invocation(s) that this build has no handler for: ` +
        `${unrecognizedInvocations.map((invocation) => `${invocation.name} (${invocation.id})`).join(', ')}. ` +
        `They were most likely queued by an older build. Add an entry to appIntentHandlers if the invocation is still expected.`
    );
  }

  const counterInvocations = supportedInvocations.filter(
    (invocation) => invocation.name === 'increaseCounter'
  );
  const orderInvocations = supportedInvocations.filter(
    (invocation) => invocation.name === 'orderFood'
  );
  const mailInvocations = supportedInvocations.filter(
    (invocation) => invocation.name === 'createMailDraft'
  );
  const mailDeleteInvocations = supportedInvocations.filter(
    (invocation) => invocation.name === 'deleteMailDrafts'
  );

  const stateUpdates = await Promise.allSettled([
    recordCounterInvocations(counterInvocations),
    recordLatestOrder(orderInvocations),
    recordMailDrafts(mailInvocations),
  ]);
  // `Promise.all` would release `withSerializedStateUpdate` as soon as one update rejects while
  // its sibling AsyncStorage operations keep running. Wait for every operation to settle before
  // advancing the queue, then surface the first failure so the invocations stay pending for retry.
  const failedUpdate = stateUpdates.find(
    (update): update is PromiseRejectedResult => update.status === 'rejected'
  );
  if (failedUpdate) {
    throw failedUpdate.reason;
  }
  // Deletions run after the creations so that a create and a delete queued together while
  // JavaScript was cold still resolve to the same end state.
  await removeMailDrafts(mailDeleteInvocations);

  // Navigate only for an invocation whose intent brought the app forward, so that an invocation
  // waiting in the pending queue cannot hijack a launch the user started themselves.
  const openingInvocations = supportedInvocations.filter(
    (invocation) => handlerForInvocation(invocation)?.opensApp
  );
  const routeSource =
    newInvocation && handlerForInvocation(newInvocation)?.opensApp
      ? newInvocation
      : latestInvocation(openingInvocations);

  return {
    handledInvocationIds: [...supportedInvocations, ...unrecognizedInvocations].map(
      (invocation) => invocation.id
    ),
    route: routeForInvocation(routeSource),
    routeInvocationId: routeSource?.id,
    routeDraftId:
      routeSource?.name === 'openMailDraft' ? stringParam(routeSource.params, 'id') : undefined,
  };
}
