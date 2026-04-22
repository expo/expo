import { ctx } from 'expo-router/_ctx';
import type { GenerateMetadataFunction, Metadata } from 'expo-server';
import { ImmutableRequest } from 'expo-server/private';

import { serializeMetadataToHtml } from '../utils/metadata/serialize';

type RouteModuleExports = {
  generateMetadata?: GenerateMetadataFunction;
};

type ResolveMetadataOptions = {
  route: {
    file: string;
    page: string;
  };
  request?: Request;
  params: Record<string, string | string[]>;
};

type ResolvedMetadata = {
  metadata: Metadata;
  headTags: string;
};

function createAbortError(signal: AbortSignal): Error {
  const reason = signal.reason;
  if (reason instanceof Error) {
    return reason;
  }
  const error = new Error(typeof reason === 'string' ? reason : 'This operation was aborted.');
  error.name = 'AbortError';
  return error;
}

async function waitForMetadataResult<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return promise;
  }

  if (signal.aborted) {
    throw createAbortError(signal);
  }

  return await new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(createAbortError(signal));
    signal.addEventListener('abort', onAbort, { once: true });

    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      }
    );
  });
}

function getGenerateMetadata(moduleExports: RouteModuleExports): GenerateMetadataFunction | null {
  return typeof moduleExports.generateMetadata === 'function'
    ? moduleExports.generateMetadata
    : null;
}

export async function resolveMetadata(
  options: ResolveMetadataOptions
): Promise<ResolvedMetadata | null> {
  if (options.request?.signal.aborted) {
    throw createAbortError(options.request.signal);
  }

  const routeModule = (await ctx(options.route.file)) as RouteModuleExports;
  const generateMetadata = getGenerateMetadata(routeModule);
  if (!generateMetadata) {
    return null;
  }

  const metadata = await waitForMetadataResult(
    Promise.resolve(
      generateMetadata(
        options.request ? new ImmutableRequest(options.request) : undefined,
        options.params
      )
    ),
    options.request?.signal
  );

  if (metadata == null) {
    return null;
  }

  return {
    metadata,
    headTags: serializeMetadataToHtml(metadata),
  };
}
