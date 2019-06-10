/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactABI33_0_0/core/LocalData.h>
#include <ReactABI33_0_0/core/Props.h>
#include <ReactABI33_0_0/core/ReactABI33_0_0Primitives.h>
#include <ReactABI33_0_0/core/ShadowNode.h>
#include <ReactABI33_0_0/events/EventEmitter.h>

namespace facebook {
namespace ReactABI33_0_0 {

/*
 * An object which supposed to be used as a parameter specifying a shape
 * of created or cloned ShadowNode.
 * Note: Most of the fields are `const &` references (essentially just raw
 * pointers) which means that the Fragment does not copy/store them or
 * retain ownership of them.
 */
struct ShadowNodeFragment {
  Tag tag = 0;
  Tag rootTag = 0;
  const SharedProps &props = nullSharedProps();
  const SharedEventEmitter &eventEmitter = nullSharedEventEmitter();
  const SharedShadowNodeSharedList &children = nullSharedChildren();
  const SharedLocalData &localData = nullLocalData();

  static SharedProps &nullSharedProps();
  static SharedEventEmitter &nullSharedEventEmitter();
  static SharedShadowNodeSharedList &nullSharedChildren();
  static SharedLocalData &nullLocalData();
};

} // namespace ReactABI33_0_0
} // namespace facebook
