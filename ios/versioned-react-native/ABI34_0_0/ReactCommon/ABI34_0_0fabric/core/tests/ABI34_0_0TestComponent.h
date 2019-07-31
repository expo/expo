/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <ReactABI34_0_0/core/ConcreteComponentDescriptor.h>
#include <ReactABI34_0_0/core/ConcreteShadowNode.h>
#include <ReactABI34_0_0/core/LocalData.h>
#include <ReactABI34_0_0/core/RawProps.h>
#include <ReactABI34_0_0/core/ShadowNode.h>

using namespace facebook::ReactABI34_0_0;

/**
 * This defines a set of TestComponent classes: Props, ShadowNode,
 * ComponentDescriptor. To be used for testing purpose.
 */

class TestLocalData : public LocalData {
 public:
  void setNumber(const int &number) {
    number_ = number;
  }

  int getNumber() const {
    return number_;
  }

 private:
  int number_{0};
};

static const char TestComponentName[] = "Test";

class TestProps : public Props {
 public:
  using Props::Props;
  TestProps()
      : Props(Props(), RawProps(folly::dynamic::object("nativeID", "testNativeID"))) {}
};
using SharedTestProps = std::shared_ptr<const TestProps>;

class TestShadowNode;
using SharedTestShadowNode = std::shared_ptr<const TestShadowNode>;
class TestShadowNode : public ConcreteShadowNode<TestComponentName, TestProps> {
 public:
  using ConcreteShadowNode::ConcreteShadowNode;
};

class TestComponentDescriptor
    : public ConcreteComponentDescriptor<TestShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};
