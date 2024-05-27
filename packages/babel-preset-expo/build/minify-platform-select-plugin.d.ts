/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { ConfigAPI, types } from '@babel/core';
export default function minifyPlatformSelectPlugin({ types: t, }: ConfigAPI & {
    types: typeof types;
}): babel.PluginObj;
