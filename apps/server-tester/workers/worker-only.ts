// The `process` read throws in a chunk that cannot use the variables of the worker entry.
export const workerOnly = process.env.E2E_WORKER_ONLY ?? 'worker-only';
