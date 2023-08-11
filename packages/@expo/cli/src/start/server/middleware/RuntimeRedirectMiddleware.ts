import { parse } from 'url';

import { disableResponseCache, ExpoMiddleware } from './ExpoMiddleware';
import {
  assertMissingRuntimePlatform,
  assertRuntimePlatform,
  parsePlatformHeader,
  resolvePlatformFromUserAgentHeader,
  RuntimePlatform,
} from './resolvePlatform';
import { ServerRequest, ServerResponse } from './server.types';
import * as Log from '../../../log';

const debug = require('debug')(
  'expo:start:server:middleware:runtimeRedirect'
) as typeof console.log;

/** Runtime to target: expo = Expo Go, custom = Dev Client. */
type RuntimeTarget = 'expo' | 'custom';

export type DeepLinkHandler = (props: {
  runtime: RuntimeTarget;
  platform: RuntimePlatform;
}) => void | Promise<void>;

export class RuntimeRedirectMiddleware extends ExpoMiddleware {
  constructor(
    protected projectRoot: string,
    protected options: {
      onDeepLink: DeepLinkHandler;
      getLocation: (props: { runtime: RuntimeTarget }) => string | null | undefined;
    }
  ) {
    super(projectRoot, ['/_expo/link']);
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    const { query } = parse(req.url!, true);
    const isDevClient = query['choice'] === 'expo-dev-client';
    const platform = parsePlatformHeader(req) ?? resolvePlatformFromUserAgentHeader(req);
    assertMissingRuntimePlatform(platform);
    assertRuntimePlatform(platform);
    const runtime = isDevClient ? 'custom' : 'expo';

    debug(`props:`, { platform, runtime });

    this.options.onDeepLink({ runtime, platform });

    const redirect = this.options.getLocation({ runtime });
    if (!redirect) {
      Log.warn(
        `[redirect middleware]: Unable to determine redirect location for runtime '${runtime}' and platform '${platform}'`
      );
      res.statusCode = 404;
      res.end();
      return;
    }
    debug('Redirect ->', redirect);
    res.setHeader('Location', redirect);

    // Disable caching
    disableResponseCache(res);

    // 'Temporary Redirect'
    res.statusCode = 307;
    res.end();
  }
}
