/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <ABI47_0_0React/ABI47_0_0renderer/element/Element.h>
#include <ABI47_0_0React/ABI47_0_0renderer/element/testUtils.h>

#include "ABI47_0_0TestComponent.h"

using namespace ABI47_0_0facebook::ABI47_0_0React;

/*
 * ┌────────┐
 * │<View>  │
 * │        │
 * │   ┌────┴───┐
 * │   │<View>  │
 * └───┤        │
 *     │        │
 *     │        │
 *     └────────┘
 */
TEST(LayoutableShadowNodeTest, relativeLayoutMetrics) {
  auto builder = simpleComponentBuilder();

  auto childShadowNode = std::shared_ptr<ViewShadowNode>{};
  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.origin = {10, 20};
        layoutMetrics.frame.size = {100, 200};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {10, 20};
          layoutMetrics.frame.size = {100, 200};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
        .reference(childShadowNode)
    });
  // clang-format on

  auto parentShadowNode = builder.build(element);

  auto relativeLayoutMetrics =
      LayoutableShadowNode::computeRelativeLayoutMetrics(
          childShadowNode->getFamily(), *parentShadowNode, {});

  // A is a parent to B, A has origin {10, 10}, B has origin {10, 10}.
  // B's relative origin to A should be {10, 10}.
  // D19447900 has more about the issue.
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.size.width, 100);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.size.height, 200);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 10);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 20);
}

/*
 * ┌──────────────┐
 * │<ScrollView>  │
 * │        ┌─────┴───┐
 * │        │<View>   │
 * │        │         │
 * └────────┤         │
 *          │         │
 *          └─────────┘
 */
TEST(LayoutableShadowNodeTest, contentOriginOffset) {
  auto builder = simpleComponentBuilder();

  auto childShadowNode = std::shared_ptr<ViewShadowNode>{};
  // clang-format off
  auto element =
    Element<ScrollViewShadowNode>()
      .finalize([](ScrollViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.origin = {10, 20};
        layoutMetrics.frame.size = {100, 200};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .stateData([](ScrollViewState &data) {
        data.contentOffset = {10, 10};
      })
      .children({
        Element<ViewShadowNode>()
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {10, 20};
          layoutMetrics.frame.size = {100, 200};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
        .reference(childShadowNode)
    });
  // clang-format on

  auto parentShadowNode = builder.build(element);

  auto relativeLayoutMetrics =
      LayoutableShadowNode::computeRelativeLayoutMetrics(
          childShadowNode->getFamily(), *parentShadowNode, {});

  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 0);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 10);

  relativeLayoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(
      childShadowNode->getFamily(), *parentShadowNode, {false});

  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 10);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 20);
}

/*
 * ┌────────────────────────┐
 * │<View>                  │
 * │      ┌────────────────┐│
 * │      │<View>          ││
 * │      │                ││
 * │      └────────────────┘│
 * └────────────────────────┘
 */
TEST(LayoutableShadowNodeTest, relativeLayoutMetricsOnTransformedNode) {
  auto builder = simpleComponentBuilder();

  auto childShadowNode = std::shared_ptr<ViewShadowNode>{};
  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {1000, 1000};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {10, 20};
          layoutMetrics.frame.size = {100, 200};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
        .props([] {
          auto sharedProps = std::make_shared<ViewShadowNodeProps>();
          sharedProps->transform = Transform::Scale(0.5, 0.5, 1);
          return sharedProps;
        })
        .reference(childShadowNode)
    });
  // clang-format on

  auto parentShadowNode = builder.build(element);

  auto relativeLayoutMetrics =
      LayoutableShadowNode::computeRelativeLayoutMetrics(
          childShadowNode->getFamily(), *parentShadowNode, {});

  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 35);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 70);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.size.width, 50);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.size.height, 100);
}

/*
 * ┌────────────────────────┐
 * │<Root>                  │
 * │ ┌─────────────────────┐│
 * │ │ <View>              ││
 * │ │     ┌──────────────┐││
 * │ │     │<View>        │││
 * │ │     │  ┌──────────┐│││
 * │ │     │  │<View>    ││││
 * │ │     │  │          ││││
 * │ │     │  │          ││││
 * │ │     │  └──────────┘│││
 * │ │     └──────────────┘││
 * │ └─────────────────────┘│
 * └────────────────────────┘
 */
TEST(LayoutableShadowNodeTest, relativeLayoutMetricsOnTransformedParent) {
  auto builder = simpleComponentBuilder();

  auto childShadowNode = std::shared_ptr<ViewShadowNode>{};
  // clang-format off
  auto element =
    Element<RootShadowNode>()
      .finalize([](RootShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {900, 900};
        shadowNode.setLayoutMetrics(layoutMetrics);
      })
      .children({
        Element<ViewShadowNode>()
        .props([] {
          auto sharedProps = std::make_shared<ViewShadowNodeProps>();
          sharedProps->transform = Transform::Scale(0.5, 0.5, 1);
          return sharedProps;
        })
        .finalize([](ViewShadowNode &shadowNode){
          auto layoutMetrics = EmptyLayoutMetrics;
          layoutMetrics.frame.origin = {10, 10};
          layoutMetrics.frame.size = {100, 100};
          shadowNode.setLayoutMetrics(layoutMetrics);
        })
        .children({
          Element<ViewShadowNode>()
          .reference(childShadowNode)
          .finalize([](ViewShadowNode &shadowNode){
            auto layoutMetrics = EmptyLayoutMetrics;
            layoutMetrics.frame.origin = {10, 10};
            layoutMetrics.frame.size = {50, 50};
            shadowNode.setLayoutMetrics(layoutMetrics);
          })
        })
    });
  // clang-format on

  auto parentShadowNode = builder.build(element);

  auto relativeLayoutMetrics =
      LayoutableShadowNode::computeRelativeLayoutMetrics(
          childShadowNode->getFamily(), *parentShadowNode, {});

  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 45);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 45);

  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.size.width, 25);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.size.height, 25);
}

/*
 * ┌────────────────┐
 * │<View>          │
 * │                │
 * └────────────────┘
 */
TEST(LayoutableShadowNodeTest, relativeLayoutMetricsOnSameNode) {
  auto builder = simpleComponentBuilder();

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {100, 200};
        layoutMetrics.frame.origin = {10, 20};
        shadowNode.setLayoutMetrics(layoutMetrics);
    });
  // clang-format on

  auto shadowNode = builder.build(element);

  auto relativeLayoutMetrics =
      LayoutableShadowNode::computeRelativeLayoutMetrics(
          shadowNode->getFamily(), *shadowNode, {});

  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 0);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 0);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.size.width, 100);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.size.height, 200);
}

/*
 * ┌────────────────┐
 * │<View>          │
 * │                │
 * └────────────────┘
 */
TEST(LayoutableShadowNodeTest, relativeLayoutMetricsOnSameTransformedNode) {
  auto builder = simpleComponentBuilder();

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .props([] {
        auto sharedProps = std::make_shared<ViewShadowNodeProps>();
        sharedProps->transform = Transform::Scale(2, 2, 1);
        return sharedProps;
      })
      .finalize([](ViewShadowNode &shadowNode){
        auto layoutMetrics = EmptyLayoutMetrics;
        layoutMetrics.frame.size = {100, 200};
        layoutMetrics.frame.origin = {10, 20};
        shadowNode.setLayoutMetrics(layoutMetrics);
    });
  // clang-format on

  auto shadowNode = builder.build(element);

  auto relativeLayoutMetrics =
      LayoutableShadowNode::computeRelativeLayoutMetrics(
          shadowNode->getFamily(), *shadowNode, {});

  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 0);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 0);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.size.width, 200);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.size.height, 400);
}

/*
 * ┌────────────────────────┐
 * │<View>                  │
 * │      ┌────────────────┐│
 * │      │<View>          ││
 * │      │                ││
 * │      └────────────────┘│
 * └────────────────────────┘
 */
TEST(LayoutableShadowNodeTest, relativeLayourMetricsOnClonedNode) {
  auto builder = simpleComponentBuilder();

  auto childShadowNode = std::shared_ptr<ViewShadowNode>{};

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .children({
        Element<ViewShadowNode>()
          .reference(childShadowNode)
      });
  // clang-format on

  auto parentShadowNode = builder.build(element);

  auto clonedChildShadowNode =
      std::static_pointer_cast<ViewShadowNode>(childShadowNode->clone({}));
  auto layoutMetrics = EmptyLayoutMetrics;
  layoutMetrics.frame.size = {50, 60};
  clonedChildShadowNode->setLayoutMetrics(layoutMetrics);

  parentShadowNode->replaceChild(*childShadowNode, clonedChildShadowNode);

  auto newRelativeLayoutMetrics =
      LayoutableShadowNode::computeRelativeLayoutMetrics(
          childShadowNode->getFamily(), *parentShadowNode, {});
  ABI47_0_0EXPECT_EQ(newRelativeLayoutMetrics.frame.size.width, 50);
  ABI47_0_0EXPECT_EQ(newRelativeLayoutMetrics.frame.size.height, 60);
}

/*
 * ┌─────────────────────────┐
 * │<View>                   │
 * │ ┌──────────────────────┐│
 * │ │<Modal>               ││
 * │ │     ┌───────────┐    ││
 * │ │     │<View>     │    ││
 * │ │     │           │    ││
 * │ │     └───────────┘    ││
 * │ └──────────────────────┘│
 * └─────────────────────────┘
 */
TEST(
    LayoutableShadowNodeTest,
    relativeLayoutMetricsOnNodesCrossingRootKindNode) {
  auto builder = simpleComponentBuilder();

  auto childShadowNode = std::shared_ptr<ViewShadowNode>{};

  // clang-format off
  auto element =
    Element<ViewShadowNode>()
      .children({
        Element<ModalHostViewShadowNode>()
          .finalize([](ModalHostViewShadowNode &shadowNode){
            auto layoutMetrics = EmptyLayoutMetrics;
            layoutMetrics.frame.origin = {10, 10};
            shadowNode.setLayoutMetrics(layoutMetrics);
          })
          .children({
            Element<ViewShadowNode>()
            .reference(childShadowNode)
            .finalize([](ViewShadowNode &shadowNode){
              auto layoutMetrics = EmptyLayoutMetrics;
              layoutMetrics.frame.origin = {10, 10};
              shadowNode.setLayoutMetrics(layoutMetrics);
            })
          })
      });

  auto parentShadowNode = builder.build(element);

  auto relativeLayoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(childShadowNode->getFamily(), *parentShadowNode, {});

  // relativeLayoutMetrics do not include offsset of nodeAA_ because it is a
  // RootKindNode.
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.x, 10);
  ABI47_0_0EXPECT_EQ(relativeLayoutMetrics.frame.origin.y, 10);
}

TEST(LayoutableShadowNodeTest, includeViewportOffset) {
  auto builder = simpleComponentBuilder();

  auto viewShadowNode = std::shared_ptr<ViewShadowNode>{};

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .props([] {
          auto sharedProps = std::make_shared<RootProps>();
          sharedProps->layoutContext.viewportOffset = {10, 20};
          return sharedProps;
        })
        .children({
          Element<ViewShadowNode>()
          .reference(viewShadowNode)
        });
  // clang-format on

  auto rootShadowNode = builder.build(element);

  // `includeViewportOffset` has to work with `includeTransform` enabled and
  // disabled.
  auto layoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(
      viewShadowNode->getFamily(),
      *rootShadowNode,
      {/* includeTransform = */ false, /* includeViewportOffset = */ true});
  ABI47_0_0EXPECT_EQ(layoutMetrics.frame.origin.x, 10);
  ABI47_0_0EXPECT_EQ(layoutMetrics.frame.origin.y, 20);

  layoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(
      viewShadowNode->getFamily(),
      *rootShadowNode,
      {/* includeTransform = */ true, /* includeViewportOffset = */ true});
  ABI47_0_0EXPECT_EQ(layoutMetrics.frame.origin.x, 10);
  ABI47_0_0EXPECT_EQ(layoutMetrics.frame.origin.y, 20);
}
