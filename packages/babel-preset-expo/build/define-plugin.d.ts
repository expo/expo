/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) 2016 Formidable
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ConfigAPI, PluginObj } from '@babel/core';
declare function definePlugin({ types: t }: ConfigAPI & typeof import('@babel/core')): PluginObj;
export default definePlugin;
