/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * https://github.com/facebook/metro/blob/87f717b8f5987827c75c82b3cb390060672628f0/packages/metro/src/DeltaBundler/Serializers/hmrJSBundle.js#L1C1-L152C30
 */
/// <reference types="node" />
/// <reference types="metro-runtime" />
import type { HmrModule } from 'metro-runtime/src/modules/types.flow';
import type { UrlWithParsedQuery as EntryPointURL } from 'url';
import type { DeltaResult, ReadOnlyGraph } from 'metro';
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
