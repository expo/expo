import { loadOther } from './shared-importer';

export type Scenario =
  | 'worker-only'
  | 'shared-target'
  | 'shared-importer'
  | 'maybe-sync'
  | 'prefetch';

// Metro syntax for the `maybeSync` and `prefetch` async dependency types.
declare const require: { unstable_importMaybeSync(path: string): any };
declare const __prefetchImport: (path: string) => void;

async function run(scenario: Scenario): Promise<string> {
  switch (scenario) {
    // The worker is the only importer of this module.
    case 'worker-only':
      return (await import('./worker-only')).workerOnly;
    // The app also imports `./other` asynchronously. `./other` imports `./math`, which the page
    // imports synchronously.
    case 'shared-target':
      return String((await import('./other')).otherResult);
    // The page and the worker both import the module that holds the async import.
    case 'shared-importer':
      return String((await loadOther()).otherResult);
    case 'maybe-sync':
      return (await require.unstable_importMaybeSync('./maybe-sync-target')).maybeSyncTarget;
    case 'prefetch':
      __prefetchImport('./prefetch-target');
      return (await import('./prefetch-target')).prefetchTarget;
  }
}

self.onmessage = async (event: MessageEvent<Scenario>) => {
  const scenario = event.data;
  try {
    self.postMessage({ scenario, result: await run(scenario) });
  } catch (error) {
    self.postMessage({ scenario, result: `error: ${error}` });
  }
};
