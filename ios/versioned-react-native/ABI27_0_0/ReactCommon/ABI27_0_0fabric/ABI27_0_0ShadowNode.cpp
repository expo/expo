/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI27_0_0ShadowNode.h"

namespace facebook {
namespace ReactABI27_0_0 {

ShadowNode::ShadowNode(int ReactABI27_0_0Tag, std::string viewName, int rootTag, folly::dynamic props, void *instanceHandle) :
  ReactABI27_0_0Tag_(ReactABI27_0_0Tag),
  viewName_(viewName),
  rootTag_(rootTag),
  props_(props),
  instanceHandle_(instanceHandle) {}

}}
