/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include "ABI42_0_0TestComponent.h"

using namespace ABI42_0_0facebook::ABI42_0_0React;

class FindNodeAtPointTest : public ::testing::Test {
 protected:
  FindNodeAtPointTest()
      : eventDispatcher_(std::shared_ptr<EventDispatcher const>()),
        componentDescriptor_(TestComponentDescriptor({eventDispatcher_})) {
    auto traits = TestShadowNode::BaseTraits();

    auto familyA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 9,
            /* .surfaceId = */ 1,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);

    nodeA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ std::make_shared<const TestProps>(),
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyA,
        traits);

    auto familyAA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 10,
            /* .surfaceId = */ 1,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);

    nodeAA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ std::make_shared<const TestProps>(),
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAA,
        traits);

    auto familyAAA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 11,
            /* .surfaceId = */ 1,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);

    nodeAAA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ std::make_shared<const TestProps>(),
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAAA,
        traits);

    nodeA_->appendChild(nodeAA_);
    nodeAA_->appendChild(nodeAAA_);

    auto layoutMetrics = EmptyLayoutMetrics;

    layoutMetrics.frame = ABI42_0_0facebook::ABI42_0_0React::Rect{
        ABI42_0_0facebook::ABI42_0_0React::Point{0, 0}, ABI42_0_0facebook::ABI42_0_0React::Size{1000, 1000}};
    nodeA_->setLayoutMetrics(layoutMetrics);

    layoutMetrics.frame = ABI42_0_0facebook::ABI42_0_0React::Rect{
        ABI42_0_0facebook::ABI42_0_0React::Point{100, 100}, ABI42_0_0facebook::ABI42_0_0React::Size{100, 100}};
    nodeAA_->setLayoutMetrics(layoutMetrics);

    layoutMetrics.frame = ABI42_0_0facebook::ABI42_0_0React::Rect{ABI42_0_0facebook::ABI42_0_0React::Point{10, 10},
                                                ABI42_0_0facebook::ABI42_0_0React::Size{10, 10}};
    nodeAAA_->setLayoutMetrics(layoutMetrics);
  }

  std::shared_ptr<EventDispatcher const> eventDispatcher_;
  std::shared_ptr<TestShadowNode> nodeA_;
  std::shared_ptr<TestShadowNode> nodeAA_;
  std::shared_ptr<TestShadowNode> nodeAAA_;
  TestComponentDescriptor componentDescriptor_;
};

TEST_F(FindNodeAtPointTest, withoutTransform) {
  ABI42_0_0EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(nodeA_, {115, 115}), nodeAAA_);
  ABI42_0_0EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(nodeA_, {105, 105}), nodeAA_);
  ABI42_0_0EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(nodeA_, {900, 900}), nodeA_);
  ABI42_0_0EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(nodeA_, {1001, 1001}), nullptr);
}

TEST_F(FindNodeAtPointTest, viewIsTranslated) {
  nodeA_->_transform =
      Transform::Identity() * Transform::Translate(-100, -100, 0);

  ABI42_0_0EXPECT_EQ(
      LayoutableShadowNode::findNodeAtPoint(nodeA_, {15, 15})->getTag(),
      nodeAAA_->getTag());
  ABI42_0_0EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(nodeA_, {5, 5}), nodeAA_);
}

TEST_F(FindNodeAtPointTest, viewIsScaled) {
  nodeAAA_->_transform = Transform::Identity() * Transform::Scale(0.5, 0.5, 0);

  ABI42_0_0EXPECT_EQ(LayoutableShadowNode::findNodeAtPoint(nodeA_, {119, 119}), nodeAA_);
}
