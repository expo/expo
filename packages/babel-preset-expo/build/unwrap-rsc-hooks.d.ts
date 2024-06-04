/**
 * Copyright © 2024 650 Industries.
 *
 * It's not clear if React Server Components depends on this behavior, but the
 * Next.js implementation from the React team has this optimization in place:
 * https://github.com/vercel/next.js/blob/08a92e0aa589e9220b0e740594c39846c69ef308/packages/next-swc/crates/next-custom-transforms/src/transforms/optimize_server_react.rs#L1
 */
import { ConfigAPI, types } from '@babel/core';
export declare function unwrapRscHooks(api: ConfigAPI & {
    types: typeof types;
}): babel.PluginObj;
