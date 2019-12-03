/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI34_0_0ShadowNodeFragment.h"

namespace facebook {
namespace ReactABI34_0_0 {

SharedProps &ShadowNodeFragment::nullSharedProps() {
  static auto &instance = *new SharedProps();
  return instance;
}

SharedEventEmitter &ShadowNodeFragment::nullSharedEventEmitter() {
  static auto &instance = *new SharedEventEmitter();
  return instance;
}

SharedShadowNodeSharedList &ShadowNodeFragment::nullSharedChildren() {
  static auto &instance = *new SharedShadowNodeSharedList();
  return instance;
}

SharedLocalData &ShadowNodeFragment::nullLocalData() {
  static auto &instance = *new SharedLocalData();
  return instance;
}

} // namespace ReactABI34_0_0
} // namespace facebook
