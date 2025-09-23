import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestAPI } from './api';
export declare function getRequestScopeSingleton(): AsyncLocalStorage<RequestAPI>;
export declare function getRequestScope(): RequestAPI | undefined;
