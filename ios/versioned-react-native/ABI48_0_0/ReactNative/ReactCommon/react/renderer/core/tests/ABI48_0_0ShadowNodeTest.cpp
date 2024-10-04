/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ConcreteShadowNode.h>
#include <ABI48_0_0React/ABI48_0_0renderer/core/ShadowNode.h>

#include "ABI48_0_0TestComponent.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

class ShadowNodeTest : public ::testing::Test {
 protected:
  ShadowNodeTest()
      : eventDispatcher_(std::shared_ptr<EventDispatcher const>()),
        componentDescriptor_(TestComponentDescriptor({eventDispatcher_})) {
    /*
     * The structure:
     * <A>
     *  <AA/>
     *  <AB>
     *    <ABA/>
     *    <ABB/>
     *  </AB>
     *  <AC/>
     * </A>
     * </Z>
     */

    auto props = std::make_shared<const TestProps>();

    auto traits = TestShadowNode::BaseTraits();

    auto familyAA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 11,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);
    nodeAA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAA,
        traits);

    auto familyABA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 12,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);
    nodeABA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyABA,
        traits);

    auto familyABB = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 13,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);
    nodeABB_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyABB,
        traits);

    auto nodeABChildren = std::make_shared<ShadowNode::ListOfShared>(
        ShadowNode::ListOfShared{nodeABA_, nodeABB_});

    auto familyAB = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 15,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);
    nodeAB_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ nodeABChildren,
        },
        familyAB,
        traits);

    auto familyAC = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 16,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);
    nodeAC_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyAC,
        traits);

    auto nodeAChildren = std::make_shared<ShadowNode::ListOfShared>(
        ShadowNode::ListOfShared{nodeAA_, nodeAB_, nodeAC_});

    auto familyA = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 17,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);
    nodeA_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ nodeAChildren,
        },
        familyA,
        traits);

    auto familyZ = std::make_shared<ShadowNodeFamily>(
        ShadowNodeFamilyFragment{
            /* .tag = */ 18,
            /* .surfaceId = */ surfaceId_,
            /* .eventEmitter = */ nullptr,
        },
        eventDispatcher_,
        componentDescriptor_);
    nodeZ_ = std::make_shared<TestShadowNode>(
        ShadowNodeFragment{
            /* .props = */ props,
            /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
        },
        familyZ,
        traits);
  }

  std::shared_ptr<EventDispatcher const> eventDispatcher_;
  std::shared_ptr<TestShadowNode> nodeA_;
  std::shared_ptr<TestShadowNode> nodeAA_;
  std::shared_ptr<TestShadowNode> nodeABA_;
  std::shared_ptr<TestShadowNode> nodeABB_;
  std::shared_ptr<TestShadowNode> nodeAB_;
  std::shared_ptr<TestShadowNode> nodeAC_;
  std::shared_ptr<TestShadowNode> nodeZ_;
  TestComponentDescriptor componentDescriptor_;

  SurfaceId surfaceId_ = 1;
};

TEST_F(ShadowNodeTest, handleShadowNodeCreation) {
  ABI48_0_0EXPECT_FALSE(nodeZ_->getSealed());
  ABI48_0_0EXPECT_STREQ(nodeZ_->getComponentName(), "Test");
  ABI48_0_0EXPECT_EQ(nodeZ_->getTag(), 18);
  ABI48_0_0EXPECT_EQ(nodeZ_->getSurfaceId(), surfaceId_);
  ABI48_0_0EXPECT_EQ(nodeZ_->getEventEmitter(), nullptr);
  ABI48_0_0EXPECT_EQ(nodeZ_->getChildren().size(), 0);
}

TEST_F(ShadowNodeTest, handleSealRecusive) {
  nodeZ_->sealRecursive();
  ABI48_0_0EXPECT_TRUE(nodeZ_->getSealed());
  ABI48_0_0EXPECT_TRUE(nodeZ_->getProps()->getSealed());
}

TEST_F(ShadowNodeTest, handleShadowNodeSimpleCloning) {
  auto nodeARevision2 =
      std::make_shared<TestShadowNode>(*nodeA_, ShadowNodeFragment{});

  ABI48_0_0EXPECT_STREQ(nodeA_->getComponentName(), nodeARevision2->getComponentName());
  ABI48_0_0EXPECT_EQ(nodeA_->getTag(), nodeARevision2->getTag());
  ABI48_0_0EXPECT_EQ(nodeA_->getSurfaceId(), nodeARevision2->getSurfaceId());
  ABI48_0_0EXPECT_EQ(nodeA_->getEventEmitter(), nodeARevision2->getEventEmitter());
}

TEST_F(ShadowNodeTest, handleShadowNodeMutation) {
  auto nodeABChildren = nodeAB_->getChildren();
  ABI48_0_0EXPECT_EQ(nodeABChildren.size(), 2);
  ABI48_0_0EXPECT_EQ(nodeABChildren.at(0), nodeABA_);
  ABI48_0_0EXPECT_EQ(nodeABChildren.at(1), nodeABB_);

  auto nodeABArevision2 =
      std::make_shared<TestShadowNode>(*nodeABA_, ShadowNodeFragment{});
  nodeAB_->replaceChild(*nodeABA_, nodeABArevision2);
  nodeABChildren = nodeAB_->getChildren();
  ABI48_0_0EXPECT_EQ(nodeABChildren.size(), 2);
  ABI48_0_0EXPECT_EQ(nodeABChildren.at(0), nodeABArevision2);
  ABI48_0_0EXPECT_EQ(nodeABChildren.at(1), nodeABB_);

  // Seal the entire tree.
  nodeAB_->sealRecursive();
  ABI48_0_0EXPECT_TRUE(nodeAB_->getSealed());
  ABI48_0_0EXPECT_TRUE(nodeABArevision2->getSealed());
  ABI48_0_0EXPECT_TRUE(nodeABB_->getSealed());
}

TEST_F(ShadowNodeTest, handleCloneFunction) {
  auto nodeABClone = nodeAB_->clone({});

  // Those two nodes are *not* same.
  ABI48_0_0EXPECT_NE(nodeAB_, nodeABClone);

  // `secondNodeClone` is an instance of `TestShadowNode`.
  ABI48_0_0EXPECT_NE(
      std::dynamic_pointer_cast<const TestShadowNode>(nodeABClone), nullptr);

  // Both nodes have same content.
  ABI48_0_0EXPECT_EQ(nodeAB_->getTag(), nodeABClone->getTag());
  ABI48_0_0EXPECT_EQ(nodeAB_->getSurfaceId(), nodeABClone->getSurfaceId());
  ABI48_0_0EXPECT_EQ(nodeAB_->getProps(), nodeABClone->getProps());
}

TEST_F(ShadowNodeTest, handleState) {
  auto family = std::make_shared<ShadowNodeFamily>(
      ShadowNodeFamilyFragment{
          /* .tag = */ 9,
          /* .surfaceId = */ surfaceId_,
          /* .eventEmitter = */ nullptr,
      },
      eventDispatcher_,
      componentDescriptor_);

  auto traits = TestShadowNode::BaseTraits();

  auto props = std::make_shared<const TestProps>();
  auto fragment = ShadowNodeFragment{
      /* .props = */ props,
      /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
      /* .state = */ {}};

  auto const initialState =
      componentDescriptor_.createInitialState(fragment, family);

  auto firstNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
          /* .state = */ initialState},
      family,
      traits);
  auto secondNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
          /* .state = */ initialState},
      family,
      traits);
  auto thirdNode = std::make_shared<TestShadowNode>(
      ShadowNodeFragment{
          /* .props = */ props,
          /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
          /* .state = */ initialState},
      family,
      traits);

  TestShadowNode::ConcreteState::Shared _state =
      std::static_pointer_cast<TestShadowNode::ConcreteState const>(
          initialState);
  _state->updateState(TestState{42});

  thirdNode->setStateData({9001});
  // State object are compared by pointer, not by value.
  ABI48_0_0EXPECT_EQ(firstNode->getState(), secondNode->getState());
  ABI48_0_0EXPECT_NE(firstNode->getState(), thirdNode->getState());
  secondNode->setStateData(TestState{42});
  ABI48_0_0EXPECT_NE(firstNode->getState(), secondNode->getState());

  // State cannot be changed for sealed shadow node.
  secondNode->sealRecursive();
  ABI48_0_0EXPECT_DEATH_IF_SUPPORTED(
      { secondNode->setStateData(TestState{42}); },
      "Attempt to mutate a sealed object.");
}
