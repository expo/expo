import * as AppIntents from 'expo-app-intents';
import * as React from 'react';

import {
  appIntentDishCatalog,
  type AppIntentRoute,
  processAppIntentInvocations,
} from './AppIntentsStore';
import { syncMailDraftCatalogAsync } from './syncMailDraftCatalogAsync';

export type AppIntentNavigationTarget = {
  route: AppIntentRoute;
  invocationId?: string;
};

export type AppIntentNavigationRef = {
  isReady(): boolean;
  navigate(name: string, params?: object): void;
  resetRoot(state: { index: number; routes: { name: string; params?: object }[] }): void;
};

type AppIntentsNavigationHandlerProps = {
  isNavigationReady: boolean;
  navigateToAppIntent: (target: AppIntentNavigationTarget) => boolean | void;
};

type AppIntentsNavigationContextValue = {
  navigateToInitialAppScreen: () => boolean | void;
};

const AppIntentsNavigationContext = React.createContext<AppIntentsNavigationContextValue | null>(
  null
);

const screenNames: Record<AppIntentRoute, string> = {
  counter: 'AppIntentCounter',
  order: 'AppIntentOrderScreen',
  mail: 'AppIntentMailScreen',
};

export function AppIntentsNavigationProvider({
  children,
  navigateToInitialAppScreen,
}: React.PropsWithChildren<AppIntentsNavigationContextValue>) {
  const value = React.useMemo(() => ({ navigateToInitialAppScreen }), [navigateToInitialAppScreen]);

  return (
    <AppIntentsNavigationContext.Provider value={value}>
      {children}
    </AppIntentsNavigationContext.Provider>
  );
}

export function useAppIntentsNavigationContext() {
  return React.useContext(AppIntentsNavigationContext);
}

export function navigateToAppIntentScreen(
  navigation: AppIntentNavigationRef | null | undefined,
  target: AppIntentNavigationTarget
): boolean {
  if (!navigation?.isReady()) {
    return false;
  }

  const params = {
    source: 'siri',
    ...(target.invocationId ? { intentId: target.invocationId } : {}),
  };

  navigation.navigate('main', {
    screen: 'apis',
    params: {
      screen: screenNames[target.route],
      params,
    },
  });
  return true;
}

export function navigateToInitialAppScreen(
  navigation: AppIntentNavigationRef | null | undefined
): boolean {
  if (!navigation?.isReady()) {
    return false;
  }

  navigation.resetRoot({
    index: 0,
    routes: [{ name: 'main' }],
  });
  return true;
}

export function AppIntentsNavigationHandler({
  isNavigationReady,
  navigateToAppIntent,
}: AppIntentsNavigationHandlerProps) {
  const navigateToAppIntentRef = React.useRef(navigateToAppIntent);
  const [pendingNavigationTarget, setPendingNavigationTarget] =
    React.useState<AppIntentNavigationTarget | null>(null);
  const [didProcessInitialIntents, setDidProcessInitialIntents] = React.useState(false);

  React.useEffect(() => {
    navigateToAppIntentRef.current = navigateToAppIntent;
  }, [navigateToAppIntent]);

  React.useEffect(() => {
    if (!AppIntents.isAvailable()) {
      return;
    }

    // `setEntityCatalogAsync` re-trains the parameterized phrases itself, so no separate
    // `refreshShortcutsAsync` call is needed. Calling it here would also race the catalog write
    // and could re-train against the previous catalog.
    //
    // It also means the rejection can come from either half: the catalog was rejected, or it was
    // stored and only the phrase refresh failed. The warning covers both, because the two need
    // different fixes and the error says which one happened.
    AppIntents.setEntityCatalogAsync('dish', appIntentDishCatalog).catch((error: unknown) => {
      console.warn(
        "Could not store the App Intents 'dish' entity catalog, or could not re-train the Siri phrases against it. Ordering a dish by voice may resolve against the previous catalog, or fail. The rest of the app is unaffected.",
        error
      );
    });

    syncMailDraftCatalogAsync().catch((error: unknown) => {
      console.warn('Could not seed App Intents mail draft catalogs.', error);
    });
  }, []);

  AppIntents.useAppIntents(async (pendingIntents, newIntent) => {
    if (newIntent) {
      console.log('[expo-app-intents invocation]', newIntent);
    }

    try {
      const result = await processAppIntentInvocations(pendingIntents, newIntent);

      // Settle every removal instead of short-circuiting on the first rejection, so one failed
      // dequeue cannot leave the other handled invocations in the queue.
      const removals = await Promise.allSettled(
        result.handledInvocationIds.map((id) => AppIntents.removePendingInvocationAsync(id))
      );
      removals.forEach((removal, index) => {
        if (removal.status === 'rejected') {
          console.warn(
            `Could not remove the handled App Intent invocation ${result.handledInvocationIds[index]} from the pending queue. It stays pending and is delivered again on the next launch.`,
            removal.reason
          );
        }
      });

      // Creating or deleting drafts changes the catalog, so the entity store needs to be rebuilt
      // from the new state.
      const mutatingNames = ['createMailDraft', 'deleteMailDrafts'];
      const didMutateDrafts =
        pendingIntents.some((invocation) => mutatingNames.includes(invocation.name)) ||
        (newIntent != null && mutatingNames.includes(newIntent.name));
      if (didMutateDrafts) {
        try {
          await syncMailDraftCatalogAsync();
        } catch (error) {
          console.warn('Could not sync App Intents mail draft catalogs.', error);
        }
      }

      if (result.route) {
        setPendingNavigationTarget({
          route: result.route,
          invocationId: result.routeInvocationId,
        });
      }
    } catch (error) {
      console.error(
        'Could not process the pending App Intent invocations. The App Intents example screens may show stale state; the rest of the app is unaffected.',
        error
      );
    } finally {
      // Always mark the initial snapshot as processed, even after a failure, so a live
      // invocation that arrives later can still navigate.
      if (newIntent == null) {
        setDidProcessInitialIntents(true);
      }
    }
  });

  React.useEffect(() => {
    if (!isNavigationReady || !didProcessInitialIntents || !pendingNavigationTarget) {
      return;
    }

    const didNavigate = navigateToAppIntentRef.current(pendingNavigationTarget);
    if (didNavigate !== false) {
      setPendingNavigationTarget(null);
    }
  }, [didProcessInitialIntents, isNavigationReady, pendingNavigationTarget]);

  return null;
}
