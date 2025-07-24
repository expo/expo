/**
 * Copyright © 2024 650 Industries.
 * Copyright © 2024 2023 lubieowoce
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * https://github.com/lubieowoce/tangle/blob/5229666fb317d0da9363363fc46dc542ba51e4f7/packages/babel-rsc/src/babel-rsc-actions.ts#L1C1-L909C25
 */
import type { ConfigAPI, PluginObj, PluginPass } from '@babel/core';
export declare function reactServerActionsPlugin(api: ConfigAPI & typeof import('@babel/core')): PluginObj<PluginPass>;
