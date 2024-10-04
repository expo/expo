/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <algorithm>
#include <memory>

#include <gtest/gtest.h>

#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorProviderRegistry.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewComponentDescriptor.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0ComponentBuilder.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0Element.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0testUtils.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0Differentiator.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0ShadowViewMutation.h>
#include <ABI49_0_0React/renderer/mounting/ABI49_0_0stubs.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

class StackingContextTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> nodeA_;
  std::shared_ptr<ViewShadowNode> nodeAA_;
  std::shared_ptr<ViewShadowNode> nodeB_;
  std::shared_ptr<ViewShadowNode> nodeBA_;
  std::shared_ptr<ViewShadowNode> nodeBB_;
  std::shared_ptr<ViewShadowNode> nodeBBA_;
  std::shared_ptr<ViewShadowNode> nodeBBB_;
  std::shared_ptr<ViewShadowNode> nodeBC_;
  std::shared_ptr<ViewShadowNode> nodeBD_;

  std::shared_ptr<RootShadowNode> currentRootShadowNode_;
  StubViewTree currentStubViewTree_;

  StackingContextTest() : builder_(simpleComponentBuilder()) {
    //  ┌────────────── (Root) ──────────────┐
    //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
    //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃                                ┃ │
    //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │
    //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │
    //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┃                            ┃ ┃ │
    //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │
    //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
    //  └────────────────────────────────────┘

    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .children({
            Element<ViewShadowNode>()
              .tag(2)
              .reference(nodeA_)
              .children({
                Element<ViewShadowNode>()
                  .tag(3)
                  .reference(nodeAA_)
              }),
            Element<ViewShadowNode>()
              .tag(4)
              .reference(nodeB_)
              .children({
                Element<ViewShadowNode>()
                  .tag(5)
                  .reference(nodeBA_),
                Element<ViewShadowNode>()
                  .tag(6)
                  .reference(nodeBB_)
                  .children({
                    Element<ViewShadowNode>()
                      .tag(7)
                      .reference(nodeBBA_),
                    Element<ViewShadowNode>()
                      .tag(8)
                      .reference(nodeBBB_)
                  }),
                Element<ViewShadowNode>()
                  .tag(9)
                  .reference(nodeBC_),
                Element<ViewShadowNode>()
                  .tag(10)
                  .reference(nodeBD_)
              })
          });
    // clang-format on

    builder_.build(element);

    currentRootShadowNode_ = rootShadowNode_;
    currentRootShadowNode_->layoutIfNeeded();
    currentStubViewTree_ =
        buildStubViewTreeWithoutUsingDifferentiator(*currentRootShadowNode_);
  }

  void mutateViewShadowNodeProps_(
      std::shared_ptr<ViewShadowNode> const &node,
      std::function<void(ViewProps &props)> callback) {
    rootShadowNode_ =
        std::static_pointer_cast<RootShadowNode>(rootShadowNode_->cloneTree(
            node->getFamily(), [&](ShadowNode const &oldShadowNode) {
              auto viewProps = std::make_shared<ViewShadowNodeProps>();
              callback(*viewProps);
              return oldShadowNode.clone(ShadowNodeFragment{viewProps});
            }));
  }

  void testViewTree_(
      std::function<void(StubViewTree const &viewTree)> const &callback) {
    rootShadowNode_->layoutIfNeeded();

    callback(buildStubViewTreeUsingDifferentiator(*rootShadowNode_));
    callback(buildStubViewTreeWithoutUsingDifferentiator(*rootShadowNode_));

    auto mutations =
        calculateShadowViewMutations(*currentRootShadowNode_, *rootShadowNode_);
    currentRootShadowNode_ = rootShadowNode_;
    currentStubViewTree_.mutate(mutations);
    callback(currentStubViewTree_);
  }
};

TEST_F(StackingContextTest, defaultPropsMakeEverythingFlattened) {
  testViewTree_([](StubViewTree const &viewTree) {
    // 1 view in total.
    ABI49_0_0EXPECT_EQ(viewTree.size(), 1);

    // The root view has no subviews.
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.size(), 0);
  });
}

TEST_F(StackingContextTest, mostPropsDoNotForceViewsToMaterialize) {
  //  ┌────────────── (Root) ──────────────┐    ┌────────── (Root) ───────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ padding: 10;               ┃ ┃ │    │                             │
  //  │ ┃ ┃ margin: 9001;              ┃ ┃ │    │                             │
  //  │ ┃ ┃ position: absolute;        ┃ ┃ │    │                             │
  //  │ ┃ ┃ shadowRadius: 10;          ┃ ┃ │    │                             │
  //  │ ┃ ┃ shadowOffset: [42, 42];    ┃ ┃ │    │                             │
  //  │ ┃ ┃ backgroundColor: clear;    ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ zIndex: 42;                ┃ ┃ │    │                             │
  //  │ ┃ ┃ margin: 42;                ┃ ┃ │    │                             │
  //  │ ┃ ┃ shadowColor: clear;        ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │ No observable side-effects. │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│   No views are generated.   │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ position: relative;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ borderRadii: 42;       ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ borderColor: black;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ onLayout: true;            ┃ ┃ │    │                             │
  //  │ ┃ ┃ hitSlop: 42;               ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(nodeAA_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.padding()[ABI49_0_0YGEdgeAll] = ABI49_0_0YGValue{42, ABI49_0_0YGUnitPoint};
    yogaStyle.margin()[ABI49_0_0YGEdgeAll] = ABI49_0_0YGValue{42, ABI49_0_0YGUnitPoint};
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeAbsolute;
    props.shadowRadius = 42;
    props.shadowOffset = Size{42, 42};
    props.backgroundColor = clearColor();
  });

  mutateViewShadowNodeProps_(nodeBA_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    props.zIndex = 42;
    yogaStyle.margin()[ABI49_0_0YGEdgeAll] = ABI49_0_0YGValue{42, ABI49_0_0YGUnitPoint};
    props.shadowColor = clearColor();
    props.shadowOpacity = 0.42;
  });

  mutateViewShadowNodeProps_(nodeBBA_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeRelative;

    props.borderRadii.all = 42;
    props.borderColors.all = blackColor();
  });

  mutateViewShadowNodeProps_(nodeBD_, [](ViewProps &props) {
    props.onLayout = true;
    props.hitSlop = EdgeInsets{42, 42, 42, 42};
  });

  testViewTree_([](StubViewTree const &viewTree) {
    // 1 view in total.
    ABI49_0_0EXPECT_EQ(viewTree.size(), 1);

    // The root view has no subviews.
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.size(), 0);
  });
}

TEST_F(StackingContextTest, somePropsForceViewsToMaterialize1) {
  //  ┌────────────── (Root) ──────────────┐    ┌─────────── (Root) ──────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ AA (tag: 3) ━━━━━━━━━━━┓ │
  //  │ ┃                                ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BA (tag: 5) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ backgroundColor: black;    ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ BBA (tag: 7) ━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃                                ┃ │    │                             │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ backgroundColor: white;    ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ shadowColor: black;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(
      nodeAA_, [](ViewProps &props) { props.backgroundColor = blackColor(); });

  mutateViewShadowNodeProps_(
      nodeBA_, [](ViewProps &props) { props.backgroundColor = whiteColor(); });

  mutateViewShadowNodeProps_(
      nodeBBA_, [](ViewProps &props) { props.shadowColor = blackColor(); });

  testViewTree_([](StubViewTree const &viewTree) {
    // 4 views in total.
    ABI49_0_0EXPECT_EQ(viewTree.size(), 4);

    // The root view has all 3 subviews.
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.size(), 3);

    // The root view subviews are [3, 5, 7].
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 3);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 5);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 7);
  });
}

TEST_F(StackingContextTest, somePropsForceViewsToMaterialize2) {
  //  ┌────────────── (Root) ──────────────┐    ┌─────────── (Root) ──────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ A (tag: 2) ━━━━━━━━━━━━┓ │
  //  │ ┃ backgroundColor: black;        ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ AA (tag: 3) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ pointerEvents: none;       ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ B (tag: 4) ━━━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ BA (tag: 5) ━━━━━━━━━━━┓ │
  //  │ ┃ testId: "42"                   ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BB (tag: 6) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ nativeId: "42"             ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┏━ BBA (tag: 7) ━━━━━━━━━━┓ │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ foregroundColor: black;    ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ BBB (tag: 8) ━━━━━━━━━━┓ │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ ┃ transform: scale(2);   ┃ ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┏━ BC (tag: 9) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃ ┃ position: relative;    ┃ ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃ ┃ zIndex: 42;            ┃ ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┏━ BD (tag: 10) ━━━━━━━━━━┓ │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃ shadowColor: black;        ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ opacity: 0.42;             ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(
      nodeA_, [](ViewProps &props) { props.backgroundColor = blackColor(); });

  mutateViewShadowNodeProps_(nodeAA_, [](ViewProps &props) {
    props.pointerEvents = PointerEventsMode::None;
  });

  mutateViewShadowNodeProps_(
      nodeB_, [](ViewProps &props) { props.testId = "42"; });

  mutateViewShadowNodeProps_(
      nodeBA_, [](ViewProps &props) { props.nativeId = "42"; });

  mutateViewShadowNodeProps_(
      nodeBB_, [](ViewProps &props) { props.foregroundColor = blackColor(); });

  mutateViewShadowNodeProps_(nodeBBA_, [](ViewProps &props) {
    props.transform = Transform::Scale(2, 2, 2);
  });

  mutateViewShadowNodeProps_(nodeBBB_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeRelative;
    props.zIndex = 42;
  });

  mutateViewShadowNodeProps_(
      nodeBC_, [](ViewProps &props) { props.shadowColor = blackColor(); });

  mutateViewShadowNodeProps_(
      nodeBD_, [](ViewProps &props) { props.opacity = 0.42; });

  testViewTree_([](StubViewTree const &viewTree) {
    // 10 views in total.
    ABI49_0_0EXPECT_EQ(viewTree.size(), 10);

    // The root view has all 9 subviews.
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.size(), 9);
  });
}

TEST_F(StackingContextTest, zIndexAndFlattenedNodes) {
  //  ┌────────────── (Root) ──────────────┐    ┌────────── (Root) ───────────┐
  //  │ ┏━ A (tag: 2) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ BD (tag: 10) ━━━━━━━━━━┓ │
  //  │ ┃                                ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ AA (tag: 3) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BC (tag: 9) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ position: relative;        ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ zIndex: 9001;              ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┏━ BBB (tag: 8) ━━━━━━━━━━┓ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┃                         ┃ │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┏━ B (tag: 4) ━━━━━━━━━━━━━━━━━━━┓ │    │ ┏━ BBA (tag: 7) ━━━━━━━━━━┓ │
  //  │ ┃                                ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃                                ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃                                ┃ │    │ ┃                         ┃ │
  //  │ ┃                                ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┏━ BA (tag: 5) ━━━━━━━━━━━━━━┓ ┃ │    │ ┏━ BA (tag: 5) ━━━━━━━━━━━┓ │
  //  │ ┃ ┃ position: relative;        ┃ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃ zIndex: 9000;              ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │ ┏━ AA (tag: 3) ━━━━━━━━━━━┓ │
  //  │ ┃ ┏━ BB (tag: 6) ━━━━━━━━━━━━━━┓ ┃ │    │ ┃ #FormsView              ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┃ #FormsStackingContext   ┃ │
  //  │ ┃ ┃                            ┃ ┃ │━━━▶│ ┃                         ┃ │
  //  │ ┃ ┃                            ┃ ┃ │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBA (tag: 7) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ position: relative;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ zIndex: 8999;          ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┏━ BBB (tag: 8) ━━━━━━━━━┓ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ position: relative;    ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃ zIndex: 8998;          ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┃                        ┃ ┃ ┃ │    │                             │
  //  │ ┃ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BC (tag: 9) ━━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ position: relative;        ┃ ┃ │    │                             │
  //  │ ┃ ┃ zIndex: 8997;              ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┃ ┏━ BD (tag: 10) ━━━━━━━━━━━━━┓ ┃ │    │                             │
  //  │ ┃ ┃ position: relative;        ┃ ┃ │    │                             │
  //  │ ┃ ┃ zIndex: 8996;              ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┃                            ┃ ┃ │    │                             │
  //  │ ┃ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ ┃ │    │                             │
  //  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │    │                             │
  //  └────────────────────────────────────┘    └─────────────────────────────┘

  mutateViewShadowNodeProps_(nodeAA_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeRelative;
    props.zIndex = 9001;
  });

  mutateViewShadowNodeProps_(nodeBA_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeRelative;
    props.zIndex = 9000;
  });

  mutateViewShadowNodeProps_(nodeBBA_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeRelative;
    props.zIndex = 8999;
  });

  mutateViewShadowNodeProps_(nodeBBB_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeRelative;
    props.zIndex = 8998;
  });

  mutateViewShadowNodeProps_(nodeBC_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeRelative;
    props.zIndex = 8997;
  });

  mutateViewShadowNodeProps_(nodeBD_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeRelative;
    props.zIndex = 8996;
  });

  testViewTree_([](StubViewTree const &viewTree) {
    // 7 views in total.
    ABI49_0_0EXPECT_EQ(viewTree.size(), 7);

    // The root view has all 6 subviews.
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.size(), 6);

    // The root view subviews are [10, 9, 8, 7, 5, 3].
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 10);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 9);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 8);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, 7);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(4)->tag, 5);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(5)->tag, 3);
  });

  // And now let's make BB to form a Stacking Context with small order-index.

  //  ┌────────────── (Root) ──────────────┐     ┌────────── (Root) ──────────┐
  //  │ ┌─ A (tag: 2) ───────────────────┐ │     │ ┏━ BB (tag: 6) ━━━━━━━━━━┓ │
  //  │ │                                │ │     │ ┃ #View                  ┃ │
  //  │ │                                │ │     │ ┃ #StackingContext       ┃ │
  //  │ │                                │ │     │ ┃                        ┃ │
  //  │ │                                │ │     │ ┃ ┏━ BBB (tag: 8) ━━━━━┓ ┃ │
  //  │ │ ┌─ AA (tag: 3) ──────────────┐ │ │     │ ┃ ┃ #View              ┃ ┃ │
  //  │ │ │ position: relative;        │ │ │     │ ┃ ┃ #StackingContext   ┃ ┃ │
  //  │ │ │ zIndex: 9001;              │ │ │     │ ┃ ┃                    ┃ ┃ │
  //  │ │ │                            │ │ │     │ ┃ ┗━━━━━━━━━━━━━━━━━━━━┛ ┃ │
  //  │ │ │                            │ │ │     │ ┃ ┏━ BBA (tag: 7) ━━━━━┓ ┃ │
  //  │ │ │                            │ │ │     │ ┃ ┃ #View              ┃ ┃ │
  //  │ │ │                            │ │ │     │ ┃ ┃ #StackingContext   ┃ ┃ │
  //  │ │ │                            │ │ │     │ ┃ ┃                    ┃ ┃ │
  //  │ │ └────────────────────────────┘ │ │     │ ┃ ┗━━━━━━━━━━━━━━━━━━━━┛ ┃ │
  //  │ └────────────────────────────────┘ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┌─ B (tag: 4) ───────────────────┐ │     │ ┏━ BD (tag: 10) ━━━━━━━━━┓ │
  //  │ │                                │ │     │ ┃ #View                  ┃ │
  //  │ │                                │ │     │ ┃ #StackingContext       ┃ │
  //  │ │                                │ │     │ ┃                        ┃ │
  //  │ │                                │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ ┌─ BA (tag: 5) ──────────────┐ │ │     │ ┏━ BC (tag: 9) ━━━━━━━━━━┓ │
  //  │ │ │ position: relative;        │ │ │     │ ┃ #View                  ┃ │
  //  │ │ │ zIndex: 9000;              │ │ │     │ ┃ #StackingContext       ┃ │
  //  │ │ │                            │ │ │     │ ┃                        ┃ │
  //  │ │ │                            │ │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ └────────────────────────────┘ │ │     │ ┏━ BA (tag: 5) ━━━━━━━━━━┓ │
  //  │ │ ╔═ BB (tag: 6) ══════════════╗ │ │     │ ┃ #View                  ┃ │
  //  │ │ ║ *** position: relative;    ║ │ │     │ ┃ #StackingContext       ┃ │
  //  │ │ ║ *** zIndex: 42;            ║ │ │━━━━▶│ ┃                        ┃ │
  //  │ │ ║                            ║ │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ ║                            ║ │ │     │ ┏━ AA (tag: 3) ━━━━━━━━━━┓ │
  //  │ │ ║ ┌─ BBA (tag: 7) ─────────┐ ║ │ │     │ ┃ #View                  ┃ │
  //  │ │ ║ │ position: relative;    │ ║ │ │     │ ┃ #StackingContext       ┃ │
  //  │ │ ║ │ zIndex: 8999;          │ ║ │ │     │ ┃                        ┃ │
  //  │ │ ║ │                        │ ║ │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ └────────────────────────┘ ║ │ │     │                            │
  //  │ │ ║ ┌─ BBB (tag: 8) ─────────┐ ║ │ │     │                            │
  //  │ │ ║ │ position: relative;    │ ║ │ │     │                            │
  //  │ │ ║ │ zIndex: 8998;          │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ └────────────────────────┘ ║ │ │     │                            │
  //  │ │ ╚════════════════════════════╝ │ │     │                            │
  //  │ │ ┌─ BC (tag: 9) ──────────────┐ │ │     │                            │
  //  │ │ │ position: relative;        │ │ │     │                            │
  //  │ │ │ zIndex: 8997;              │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ └────────────────────────────┘ │ │     │                            │
  //  │ │ ┌─ BD (tag: 10) ─────────────┐ │ │     │                            │
  //  │ │ │ position: relative;        │ │ │     │                            │
  //  │ │ │ zIndex: 8996;              │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ └────────────────────────────┘ │ │     │                            │
  //  │ └────────────────────────────────┘ │     │                            │
  //  └────────────────────────────────────┘     └────────────────────────────┘

  mutateViewShadowNodeProps_(nodeBB_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeRelative;
    props.zIndex = 42;
  });

  testViewTree_([](StubViewTree const &viewTree) {
    // 8 views in total.
    ABI49_0_0EXPECT_EQ(viewTree.size(), 8);

    // The root view has 5 subviews.
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.size(), 5);

    // The root view subviews are [6, 10, 9, 5, 3].
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 6);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 10);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 9);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, 5);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(4)->tag, 3);

    auto &view6 = viewTree.getStubView(6);
    ABI49_0_0EXPECT_EQ(view6.children.size(), 2);
    ABI49_0_0EXPECT_EQ(view6.children.at(0)->tag, 8);
    ABI49_0_0EXPECT_EQ(view6.children.at(1)->tag, 7);
  });

  // And now, let's revert it back.

  mutateViewShadowNodeProps_(nodeBB_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.positionType() = ABI49_0_0YGPositionTypeStatic;
    props.zIndex = {};
  });

  testViewTree_([](StubViewTree const &viewTree) {
    // 7 views in total.
    ABI49_0_0EXPECT_EQ(viewTree.size(), 7);

    // The root view has all 6 subviews.
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.size(), 6);

    // The root view subviews are [10, 9, 8, 7, 5, 3].
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 10);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 9);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 8);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, 7);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(4)->tag, 5);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(5)->tag, 3);
  });

  // And now, let's hide BB completety.

  //  ┌────────────── (Root) ──────────────┐     ┌────────── (Root) ──────────┐
  //  │ ┌─ A (tag: 2) ───────────────────┐ │     │ ┏━ BD (tag: 10) ━━━━━━━━━┓ │
  //  │ │                                │ │     │ ┃ #View                  ┃ │
  //  │ │                                │ │     │ ┃ #StackingContext       ┃ │
  //  │ │                                │ │     │ ┃                        ┃ │
  //  │ │                                │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ ┌─ AA (tag: 3) ──────────────┐ │ │     │ ┏━ BC (tag: 9) ━━━━━━━━━━┓ │
  //  │ │ │ position: relative;        │ │ │     │ ┃ #View                  ┃ │
  //  │ │ │ zIndex: 9001;              │ │ │     │ ┃ #StackingContext       ┃ │
  //  │ │ │                            │ │ │     │ ┃                        ┃ │
  //  │ │ │                            │ │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ │                            │ │ │     │ ┏━ BA (tag: 5) ━━━━━━━━━━┓ │
  //  │ │ │                            │ │ │     │ ┃ #View                  ┃ │
  //  │ │ │                            │ │ │     │ ┃ #StackingContext       ┃ │
  //  │ │ └────────────────────────────┘ │ │     │ ┃                        ┃ │
  //  │ └────────────────────────────────┘ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ ┌─ B (tag: 4) ───────────────────┐ │     │ ┏━ AA (tag: 3) ━━━━━━━━━━┓ │
  //  │ │                                │ │     │ ┃ #View                  ┃ │
  //  │ │                                │ │     │ ┃ #StackingContext       ┃ │
  //  │ │                                │ │     │ ┃                        ┃ │
  //  │ │                                │ │     │ ┗━━━━━━━━━━━━━━━━━━━━━━━━┛ │
  //  │ │ ┌─ BA (tag: 5) ──────────────┐ │ │     │                            │
  //  │ │ │ position: relative;        │ │ │     │                            │
  //  │ │ │ zIndex: 9000;              │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ └────────────────────────────┘ │ │     │                            │
  //  │ │ ╔═ BB (tag: 6) ══════════════╗ │ │     │                            │
  //  │ │ ║ *** display: none;         ║ │ │     │                            │
  //  │ │ ║                            ║ │ │━━━━▶│                            │
  //  │ │ ║                            ║ │ │     │                            │
  //  │ │ ║                            ║ │ │     │                            │
  //  │ │ ║ ┌─ BBA (tag: 7) ─────────┐ ║ │ │     │                            │
  //  │ │ ║ │ position: relative;    │ ║ │ │     │                            │
  //  │ │ ║ │ zIndex: 8999;          │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ └────────────────────────┘ ║ │ │     │                            │
  //  │ │ ║ ┌─ BBB (tag: 8) ─────────┐ ║ │ │     │                            │
  //  │ │ ║ │ position: relative;    │ ║ │ │     │                            │
  //  │ │ ║ │ zIndex: 8998;          │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ │                        │ ║ │ │     │                            │
  //  │ │ ║ └────────────────────────┘ ║ │ │     │                            │
  //  │ │ ╚════════════════════════════╝ │ │     │                            │
  //  │ │ ┌─ BC (tag: 9) ──────────────┐ │ │     │                            │
  //  │ │ │ position: relative;        │ │ │     │                            │
  //  │ │ │ zIndex: 8997;              │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ └────────────────────────────┘ │ │     │                            │
  //  │ │ ┌─ BD (tag: 10) ─────────────┐ │ │     │                            │
  //  │ │ │ position: relative;        │ │ │     │                            │
  //  │ │ │ zIndex: 8996;              │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ │                            │ │ │     │                            │
  //  │ │ └────────────────────────────┘ │ │     │                            │
  //  │ └────────────────────────────────┘ │     │                            │
  //  └────────────────────────────────────┘     └────────────────────────────┘

  mutateViewShadowNodeProps_(nodeBB_, [](ViewProps &props) {
    auto &yogaStyle = props.yogaStyle;
    yogaStyle.display() = ABI49_0_0YGDisplayNone;
  });

  testViewTree_([](StubViewTree const &viewTree) {
    // 5 views in total.
    ABI49_0_0EXPECT_EQ(viewTree.size(), 8);

    // The root view has all 5 subviews.
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.size(), 5);

    // The root view subviews are [6, 10, 9, 5].
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(0)->tag, 6);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(1)->tag, 10);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(2)->tag, 9);
    ABI49_0_0EXPECT_EQ(viewTree.getRootStubView().children.at(3)->tag, 5);
  });
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
