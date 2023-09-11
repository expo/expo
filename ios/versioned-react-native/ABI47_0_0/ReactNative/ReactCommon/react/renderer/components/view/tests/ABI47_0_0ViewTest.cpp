/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <algorithm>
#include <memory>

#include <gtest/gtest.h>

#include <ABI47_0_0React/ABI47_0_0renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <ABI47_0_0React/ABI47_0_0renderer/components/view/ViewComponentDescriptor.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/PropsParserContext.h>
#include <ABI47_0_0React/ABI47_0_0renderer/element/ComponentBuilder.h>

#include <ABI47_0_0React/ABI47_0_0renderer/element/Element.h>
#include <ABI47_0_0React/ABI47_0_0renderer/element/testUtils.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

class YogaDirtyFlagTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> innerShadowNode_;
  std::shared_ptr<ScrollViewShadowNode> scrollViewShadowNode_;

  YogaDirtyFlagTest() : builder_(simpleComponentBuilder()) {
    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .children({
            Element<ViewShadowNode>()
              .tag(2),
            Element<ViewShadowNode>()
              .tag(3)
              .reference(innerShadowNode_)
              .children({
                Element<ViewShadowNode>()
                  .tag(4)
                  .props([] {
                    /*
                     * Some non-default props.
                     */
                    auto mutableViewProps = std::make_shared<ViewShadowNodeProps>();
                    auto &props = *mutableViewProps;
                    props.nativeId = "native Id";
                    props.opacity = 0.5;
                    props.yogaStyle.alignContent() = ABI47_0_0YGAlignBaseline;
                    props.yogaStyle.flexDirection() = ABI47_0_0YGFlexDirectionRowReverse;
                    return mutableViewProps;
                  }),
                Element<ViewShadowNode>()
                  .tag(5),
                Element<ViewShadowNode>()
                  .tag(6),
                Element<ScrollViewShadowNode>()
                  .reference(scrollViewShadowNode_)
                  .tag(7)
                  .children({
                    Element<ViewShadowNode>()
                      .tag(8)
                  })
              })
          });
    // clang-format on

    builder_.build(element);

    /*
     * Yoga nodes are dirty right after creation.
     */
    ABI47_0_0EXPECT_TRUE(rootShadowNode_->layoutIfNeeded());

    /*
     * Yoga nodes are clean (not dirty) right after layout pass.
     */
    ABI47_0_0EXPECT_FALSE(rootShadowNode_->layoutIfNeeded());
  }
};

TEST_F(YogaDirtyFlagTest, cloningPropsWithoutChangingThem) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  /*
   * Cloning props without changing them must *not* dirty a Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [&](ShadowNode const &oldShadowNode) {
        auto &componentDescriptor = oldShadowNode.getComponentDescriptor();
        auto props = componentDescriptor.cloneProps(
            parserContext, oldShadowNode.getProps(), RawProps());
        return oldShadowNode.clone(ShadowNodeFragment{props});
      });

  ABI47_0_0EXPECT_FALSE(
      static_cast<RootShadowNode &>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, changingNonLayoutSubPropsMustNotDirtyYogaNode) {
  /*
   * Changing *non-layout* sub-props must *not* dirty a Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [](ShadowNode const &oldShadowNode) {
        auto viewProps = std::make_shared<ViewShadowNodeProps>();
        auto &props = *viewProps;

        props.nativeId = "some new native Id";
        props.foregroundColor = whiteColor();
        props.backgroundColor = blackColor();
        props.opacity = props.opacity + 0.042;
        props.zIndex = props.zIndex.value_or(0) + 42;
        props.shouldRasterize = !props.shouldRasterize;
        props.collapsable = !props.collapsable;

        return oldShadowNode.clone(ShadowNodeFragment{viewProps});
      });

  ABI47_0_0EXPECT_FALSE(
      static_cast<RootShadowNode &>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, changingLayoutSubPropsMustDirtyYogaNode) {
  /*
   * Changing *layout* sub-props *must* dirty a Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [](ShadowNode const &oldShadowNode) {
        auto viewProps = std::make_shared<ViewShadowNodeProps>();
        auto &props = *viewProps;

        props.yogaStyle.alignContent() = ABI47_0_0YGAlignBaseline;
        props.yogaStyle.display() = ABI47_0_0YGDisplayNone;

        return oldShadowNode.clone(ShadowNodeFragment{viewProps});
      });

  ABI47_0_0EXPECT_TRUE(
      static_cast<RootShadowNode &>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, removingAllChildrenMustDirtyYogaNode) {
  /*
   * Removing all children *must* dirty a Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [](ShadowNode const &oldShadowNode) {
        return oldShadowNode.clone(
            {ShadowNodeFragment::propsPlaceholder(),
             ShadowNode::emptySharedShadowNodeSharedList()});
      });

  ABI47_0_0EXPECT_TRUE(
      static_cast<RootShadowNode &>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, removingLastChildMustDirtyYogaNode) {
  /*
   * Removing the last child *must* dirty the Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [](ShadowNode const &oldShadowNode) {
        auto children = oldShadowNode.getChildren();
        children.pop_back();

        std::reverse(children.begin(), children.end());

        return oldShadowNode.clone(
            {ShadowNodeFragment::propsPlaceholder(),
             std::make_shared<ShadowNode::ListOfShared const>(children)});
      });

  ABI47_0_0EXPECT_TRUE(
      static_cast<RootShadowNode &>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, reversingListOfChildrenMustDirtyYogaNode) {
  /*
   * Reversing a list of children *must* dirty a Yoga node.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      innerShadowNode_->getFamily(), [](ShadowNode const &oldShadowNode) {
        auto children = oldShadowNode.getChildren();

        std::reverse(children.begin(), children.end());

        return oldShadowNode.clone(
            {ShadowNodeFragment::propsPlaceholder(),
             std::make_shared<ShadowNode::ListOfShared const>(children)});
      });

  ABI47_0_0EXPECT_TRUE(
      static_cast<RootShadowNode &>(*newRootShadowNode).layoutIfNeeded());
}

TEST_F(YogaDirtyFlagTest, updatingStateForScrollViewMistNotDirtyYogaNode) {
  /*
   * Updating a state for *some* (not all!) components must *not* dirty Yoga
   * nodes.
   */
  auto newRootShadowNode = rootShadowNode_->cloneTree(
      scrollViewShadowNode_->getFamily(), [](ShadowNode const &oldShadowNode) {
        auto state = ScrollViewState{};
        state.contentOffset = Point{42, 9000};

        auto &componentDescriptor = oldShadowNode.getComponentDescriptor();
        auto newState = componentDescriptor.createState(
            oldShadowNode.getFamily(),
            std::make_shared<ScrollViewState>(state));

        return oldShadowNode.clone(
            {ShadowNodeFragment::propsPlaceholder(),
             ShadowNodeFragment::childrenPlaceholder(),
             newState});
      });

  ABI47_0_0EXPECT_FALSE(
      static_cast<RootShadowNode &>(*newRootShadowNode).layoutIfNeeded());
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
