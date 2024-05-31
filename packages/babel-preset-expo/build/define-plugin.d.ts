/**
 * Copyright © 2024 650 Industries.
 * Copyright (c) 2016 Formidable
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as t from '@babel/types';
declare const plugin: ({ types }: {
    types: typeof t;
}) => babel.PluginObj;
export default plugin;
