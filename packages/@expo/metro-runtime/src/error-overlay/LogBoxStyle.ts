/**
 * Copyright (c) 650 Industries.
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function getBackgroundColor(opacity?: number): string {
  return `rgba(0, 0, 0, ${opacity == null ? 1 : opacity})`;
  // return `rgba(51, 51, 51, ${opacity == null ? 1 : opacity})`;
}

export function getTextColor(opacity?: number): string {
  return `rgba(255, 255, 255, ${opacity == null ? 1 : opacity})`;
}
