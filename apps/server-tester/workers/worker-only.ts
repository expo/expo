// The worker reads this flag to check that this module runs only after the worker imports it.
(globalThis as { didRunWorkerOnly?: boolean }).didRunWorkerOnly = true;

export const workerOnly = 'worker-only';
