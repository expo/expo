/**
 * Copyright © 2025 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork with support for using the same serializer paths as production and the first bundle.
 * https://github.com/facebook/metro/blob/87f717b8f5987827c75c82b3cb390060672628f0/packages/metro/src/DeltaBundler/Serializers/hmrJSBundle.js#L1C1-L152C30
 */
import type { DeltaResult, ReadOnlyGraph } from '@expo/metro/metro/DeltaBundler';
import type { HmrModule } from '@expo/metro/metro-runtime/modules/types.flow';
import type { UrlWithParsedQuery as EntryPointURL } from 'node:url';
type Options = {
    clientUrl: EntryPointURL;
    createModuleId: (id: string) => number;
    includeAsyncPaths: boolean;
    projectRoot: string;
    serverRoot: string;
};
declare function hmrJSBundle(delta: DeltaResult<any>, graph: ReadOnlyGraph<any>, options: Options): {
    added: readonly HmrModule[];
    modified: readonly HmrModule[];
    deleted: readonly number[];
};
export default hmrJSBundle;
