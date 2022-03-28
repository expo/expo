import { parse } from 'url';

import * as Log from '../../../log';
import { disableResponseCache, ExpoMiddleware } from './ExpoMiddleware';
import {
  assertMissingRuntimePlatform,
  assertRuntimePlatform,
  parsePlatformHeader,
  RuntimePlatform,
} from './resolvePlatform';
import { ServerRequest, ServerResponse } from './server.types';

/** Runtime to target: expo = Expo Go, custom = Dev Client. */
type RuntimeTarget = 'expo' | 'custom';

export class RuntimeRedirectMiddleware extends ExpoMiddleware {
  constructor(
    protected projectRoot: string,
    protected options: {
      onDeepLink: (props: {
        runtime: RuntimeTarget;
        platform: RuntimePlatform;
      }) => void | Promise<void>;
      getLocation: (props: { runtime: RuntimeTarget }) => string | null | undefined;
    }
  ) {
    super(projectRoot, ['/_expo/link']);
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    const { query } = parse(req.url!, true);
    const isDevClient = query['choice'] === 'expo-dev-client';
    const platform = parsePlatformHeader(req);
    assertMissingRuntimePlatform(platform);
    assertRuntimePlatform(platform);
    const runtime = isDevClient ? 'custom' : 'expo';

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
    Log.debug('Redirect ->', redirect);
    res.setHeader('Location', redirect);

    // Disable caching
    disableResponseCache(res);

    // 'Temporary Redirect'
    res.statusCode = 307;
    res.end();
  }
}
