import * as AppIntents from 'expo-app-intents';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';

import {
  appIntentDishCatalog,
  type AppIntentRoute,
  processAppIntentInvocations,
} from './AppIntentsStore';
import { syncJournalEntryCatalogAsync } from './syncJournalEntryCatalogAsync';

export type AppIntentNavigationTarget = {
  route: AppIntentRoute;
  invocationId?: string;
  entryId?: string;
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

const AppIntentsNavigationContext =
  React.createContext<AppIntentsNavigationContextValue | null>(null);

const screenNames: Record<AppIntentRoute, string> = {
  counter: 'AppIntentCounter',
  order: 'AppIntentOrderScreen',
  journal: 'AppIntentJournalScreen',
};

export function AppIntentsNavigationProvider({
  children,
  navigateToInitialAppScreen,
}: React.PropsWithChildren<AppIntentsNavigationContextValue>) {
  const value = React.useMemo(
    () => ({ navigateToInitialAppScreen }),
    [navigateToInitialAppScreen]
  );

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
    ...(target.entryId ? { entryId: target.entryId } : {}),
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

    AppIntents.setEntityCatalogAsync('dish', appIntentDishCatalog).catch((error: unknown) => {
      console.warn('Could not seed App Intents restaurant catalogs.', error);
    });

    syncJournalEntryCatalogAsync().catch((error: unknown) => {
      console.warn('Could not seed App Intents journal catalogs.', error);
    });

    AppIntents.refreshShortcutsAsync().catch((error: unknown) => {
      console.warn('Could not refresh App Intents shortcuts.', error);
    });
  }, []);

  AppIntents.useAppIntents(async (pendingIntents, newIntent) => {
    if (newIntent) {
      console.log('[expo-app-intents invocation]', newIntent);
    }

    const result = await processAppIntentInvocations(pendingIntents, newIntent);
    if (
      pendingIntents.some((intent) => intent.name === 'createJournalEntry') ||
      newIntent?.name === 'createJournalEntry'
    ) {
      await syncJournalEntryCatalogAsync().catch((error: unknown) => {
        console.warn('Could not sync App Intents journal catalogs.', error);
      });
    }

    await Promise.all(
      result.handledInvocationIds.map((id) => AppIntents.removePendingInvocationAsync(id))
    );

    if (result.route) {
      setPendingNavigationTarget({
        route: result.route,
        invocationId: result.routeInvocationId,
        entryId: result.routeEntryId,
      });
    }
    if (newIntent == null) {
      setDidProcessInitialIntents(true);
    }
  });

  React.useEffect(() => {
    if (!isNavigationReady || !didProcessInitialIntents) {
      return;
    }
    if (!pendingNavigationTarget) {
      SplashScreen.hide();
      return;
    }

    const didNavigate = navigateToAppIntentRef.current(pendingNavigationTarget);
    if (didNavigate !== false) {
      setPendingNavigationTarget(null);
      SplashScreen.hide();
    }
  }, [didProcessInitialIntents, isNavigationReady, pendingNavigationTarget]);

  return null;
}
