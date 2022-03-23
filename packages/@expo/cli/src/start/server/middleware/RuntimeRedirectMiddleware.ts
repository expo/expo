import { parse } from 'url';

import * as Log from '../../../log';
import { disableResponseCache, ExpoMiddleware } from './ExpoMiddleware';
import { assertRuntimePlatform, parsePlatformHeader, RuntimePlatform } from './resolvePlatform';
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
      getLocation: (props: { runtime: RuntimeTarget }) => string;
    }
  ) {
    super(projectRoot, ['/_expo/link']);
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    const { query } = parse(req.url!, true);
    const isDevClient = query['choice'] === 'expo-dev-client';
    const platform = parsePlatformHeader(req);
    assertRuntimePlatform(platform);
    const runtime = isDevClient ? 'custom' : 'expo';

    this.options.onDeepLink({ runtime, platform });

    const redirect = this.options.getLocation({ runtime });
    Log.debug('Redirect ->', redirect);
    res.setHeader('Location', redirect);

    // Disable caching
    disableResponseCache(res);

    // 'Temporary Redirect'
    res.statusCode = 307;
    res.end();
  }
}
