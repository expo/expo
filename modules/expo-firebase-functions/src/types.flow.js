export type HttpsCallableResult = {
  data: Object,
};

export type FunctionsErrorCode =
  | 'ok'
  | 'cancelled'
  | 'unknown'
  | 'invalid-argument'
  | 'deadline-exceeded'
  | 'not-found'
  | 'already-exists'
  | 'permission-denied'
  | 'resource-exhausted'
  | 'failed-precondition'
  | 'aborted'
  | 'out-of-range'
  | 'unimplemented'
  | 'internal'
  | 'unavailable'
  | 'data-loss'
  | 'unauthenticated';

export type HttpsCallablePromise = Promise<HttpsCallableResult> | Promise<HttpsError>;

export type HttpsCallable = (data?: any) => HttpsCallablePromise;

export type HttpsErrorCode = { [name: string]: FunctionsErrorCode };
