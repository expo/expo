export type HttpsCallableResult = {
  data: { [key: string]: any };
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

export interface HttpsErrorInterface extends Error {
  details?: any;
  code: FunctionsErrorCode;
}

export type HttpsCallablePromise = Promise<HttpsCallableResult> | Promise<HttpsErrorInterface>;

export type HttpsCallable = (data?: any) => HttpsCallablePromise;

export type HttpsErrorCode = { [name: string]: FunctionsErrorCode };
