/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <folly/dynamic.h>
#include <ABI42_0_0React/components/view/ConcreteViewShadowNode.h>
#include <ABI42_0_0React/components/view/ViewEventEmitter.h>
#include <ABI42_0_0React/components/view/ViewProps.h>
#include <ABI42_0_0React/core/ConcreteComponentDescriptor.h>
#include <ABI42_0_0React/core/RawProps.h>
#include <ABI42_0_0React/core/ShadowNode.h>

using namespace ABI42_0_0facebook::ABI42_0_0React;

/**
 * This defines a set of TestComponent classes: Props, ShadowNode,
 * ComponentDescriptor. To be used for testing purpose.
 */

class TestState {
 public:
  int number;
};

static const char TestComponentName[] = "Test";

class TestProps : public ViewProps {
 public:
  using ViewProps::ViewProps;

  TestProps(const TestProps &sourceProps, const RawProps &rawProps)
      : ViewProps(sourceProps, rawProps) {}
};

using SharedTestProps = std::shared_ptr<const TestProps>;

class TestShadowNode;

using SharedTestShadowNode = std::shared_ptr<const TestShadowNode>;

class TestShadowNode : public ConcreteViewShadowNode<
                           TestComponentName,
                           TestProps,
                           ViewEventEmitter,
                           TestState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  Transform _transform{Transform::Identity()};

  Transform getTransform() const override {
    return _transform;
  }
};

class TestComponentDescriptor
    : public ConcreteComponentDescriptor<TestShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};
