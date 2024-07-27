import type * as PubSub from '@daniel-nagy/transporter/build/PubSub';

import type { Context } from './web-context';

/**
 * An API contract between the native app and the webview.
 */
export type Api<Props> = {
  context: PubSub.t<Context>;
  props: PubSub.t<Props>;
};
