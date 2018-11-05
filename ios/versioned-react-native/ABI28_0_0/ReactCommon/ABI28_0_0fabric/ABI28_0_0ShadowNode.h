/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <memory>

namespace facebook {
namespace ReactABI28_0_0 {

class ShadowNode {
public:
  int ReactABI28_0_0Tag_;
  std::string viewName_;
  int rootTag_;
  folly::dynamic props_;
  void *instanceHandle_;

  ShadowNode(int ReactABI28_0_0Tag, std::string viewName, int rootTag, folly::dynamic props, void *instanceHandle);
};

}}
