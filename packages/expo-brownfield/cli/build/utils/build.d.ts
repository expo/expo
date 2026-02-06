import { WithSpinnerParams } from './types';
export declare const withSpinner: <T>({ operation, loaderMessage, successMessage, errorMessage, onError, verbose, }: WithSpinnerParams<T>) => Promise<T>;
