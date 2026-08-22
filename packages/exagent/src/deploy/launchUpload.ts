// @ref llp/0007-deploy-and-headless.rfc.md §Cross-platform deploy
// The one request that creates a Launch: the gzipped project source, streamed, answered with the
// URL the user finishes in the browser.
//
// Ported from the reference implementation, `create-launch` (src/services/launch.ts): same
// endpoint, same headers, same response shape, so the service sees the same request from either
// tool. No key of any kind is embedded here — the request is made as the signed-in user
// (`launchAuth.ts`).

import { CommandError } from '../utils/errors';
import type { LaunchAuth } from './launchAuth';

/** What the service answers with. */
export interface LaunchResponse {
  /** Identifier of the launch, for support and for a later lookup. */
  id: string;
  /** The URL that continues the launch in a browser. */
  url: string;
  /** Framework the service recognized in the uploaded source, e.g. `expo`. */
  framework: string;
}

export interface CreateLaunchOptions {
  auth: LaunchAuth;
  /** The gzipped tarball, streamed rather than buffered: a project can be hundreds of megabytes. */
  body: ReadableStream<Uint8Array>;
  /**
   * Path of the app inside the tarball, for a monorepo upload, e.g. `apps/mobile`. Left out when
   * the upload root *is* the project.
   */
  projectRoot?: string;
}

/** Host of the Launch service. Overridable so a test can answer the request locally. */
const DEFAULT_LAUNCH_HOST = 'launch.expo.dev';

/**
 * The endpoint one launch is created at.
 *
 * `LAUNCH_HOST` is the same override the reference implementation reads, and a bare host is reached
 * over https exactly as it is there. A host that carries its own scheme keeps it, which is how the
 * e2e suite points this at a local server instead of the service.
 */
export function launchEndpoint(): string {
  const host = process.env.LAUNCH_HOST || DEFAULT_LAUNCH_HOST;
  const origin = /^https?:\/\//i.test(host) ? host : `https://${host}`;
  return `${origin.replace(/\/+$/, '')}/--/v1/launch/cli`;
}

/** Version of this package, for the `User-Agent` the service logs. */
function userAgent(): string {
  const { version } = require('../../package.json') as { version: string };
  return `exagent/${version}`;
}

/**
 * Upload the project source and create a launch.
 *
 * @throws {CommandError} `LAUNCH_NOT_AUTHENTICATED` when the credential was rejected,
 * `LAUNCH_API` for anything else the service answered, `LAUNCH_UNREACHABLE` when the request never
 * got an answer.
 */
export async function createLaunchAsync(options: CreateLaunchOptions): Promise<LaunchResponse> {
  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/gzip');
  headers.set('User-Agent', userAgent());

  if (options.auth.type === 'session') {
    headers.set('Expo-Session', options.auth.value);
  } else {
    headers.set('Authorization', `Bearer ${options.auth.value}`);
  }

  if (options.projectRoot) {
    headers.set('x-project-root', options.projectRoot);
  }

  const endpoint = launchEndpoint();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: options.body,
      // A streamed body needs a half duplex request; without it the whole tarball is buffered.
      duplex: 'half',
    } as RequestInit);
  } catch (cause: any) {
    const error = new CommandError(
      'LAUNCH_UNREACHABLE',
      [
        `The upload to ${endpoint} could not be made, so no launch was created.`,
        `Why: the request failed before the service answered (${cause?.message ?? cause}).`,
        `How: check this machine's network access to launch.expo.dev, then run the command again. Nothing was uploaded, so running it again is safe.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent deploy --native';
    throw error;
  }

  if (response.ok) {
    const data = (await response.json()) as LaunchResponse;
    return { id: data.id, url: data.url, framework: data.framework };
  }

  const message = await readErrorMessageAsync(response);

  if (response.status === 401 || response.status === 403) {
    const error = new CommandError(
      'LAUNCH_NOT_AUTHENTICATED',
      [
        `Launch did not accept the credential of this machine (${response.status}).`,
        `Why: the session or token used for the upload is expired, revoked, or belongs to an account without access${message ? ` — the service said: ${message}` : ''}.`,
        `How: run "npx expo login" to sign in again, or replace EXPO_TOKEN with a current token from https://expo.dev/settings/access-tokens.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx expo login';
    throw error;
  }

  const error = new CommandError(
    'LAUNCH_API',
    [
      `Launch refused the upload (${response.status} ${response.statusText || 'error'}).`,
      `Why: ${message ?? 'the service answered with no message, so the reason is only in its own logs.'}`,
      `How: fix what the message names and run the command again; nothing was created, so a retry is safe. Report the launch id or this status to Expo support if it keeps happening.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent deploy --native';
  throw error;
}

/** The message the service put in its error body, when it put one there. */
async function readErrorMessageAsync(response: Response): Promise<string | null> {
  const body = await response.json().catch(() => null);
  if (body && typeof body === 'object' && 'message' in body) {
    return String((body as { message: unknown }).message);
  }
  return null;
}
