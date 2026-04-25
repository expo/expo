// Copied from expo-router global.ts
interface RouterGlobal {
  get navigationEvents(): {
    enable: () => void;
    saveCurrentPathname: () => void;
    addListener: (
      type: 'pageFocused',
      callback: (event: { pathname: string; params: Record<string, string> }) => void
    ) => void;
  };
  get currentPathname(): string | undefined;
  get currentParams(): Record<string, string> | undefined;
}

let initialPathname: string | undefined;

export function initRouterNavigationEvents() {
  if (globalThis && globalThis.expo && 'router' in globalThis.expo) {
    const router = globalThis.expo.router as RouterGlobal | undefined;
    router?.navigationEvents?.enable?.();
    router?.navigationEvents?.saveCurrentPathname?.();
    router?.navigationEvents?.addListener?.('pageFocused', ({ pathname }) => {
      if (!initialPathname) {
        initialPathname = pathname;
      }
    });
  }
}

export function getInitialRouteName(): string | undefined {
  return initialPathname;
}
