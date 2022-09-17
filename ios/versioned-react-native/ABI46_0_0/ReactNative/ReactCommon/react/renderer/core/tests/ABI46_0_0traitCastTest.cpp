/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <ABI46_0_0React/ABI46_0_0renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#include <ABI46_0_0React/ABI46_0_0renderer/components/text/ParagraphComponentDescriptor.h>
#include <ABI46_0_0React/ABI46_0_0renderer/components/text/RawTextComponentDescriptor.h>
#include <ABI46_0_0React/ABI46_0_0renderer/components/text/TextComponentDescriptor.h>
#include <ABI46_0_0React/ABI46_0_0renderer/components/view/ViewComponentDescriptor.h>

#include <ABI46_0_0React/ABI46_0_0renderer/element/Element.h>
#include <ABI46_0_0React/ABI46_0_0renderer/element/testUtils.h>

using namespace ABI46_0_0facebook::ABI46_0_0React;

TEST(traitCastTest, testOne) {
  auto builder = simpleComponentBuilder();

  auto viewShadowNode = std::shared_ptr<ViewShadowNode>{};
  auto scrollViewShadowNode = std::shared_ptr<ScrollViewShadowNode>{};
  auto paragraphShadowNode = std::shared_ptr<ParagraphShadowNode>{};
  auto textShadowNode = std::shared_ptr<TextShadowNode>{};
  auto rawTextShadowNode = std::shared_ptr<RawTextShadowNode>{};

  // clang-format off
  auto element =
      Element<ScrollViewShadowNode>()
        .reference(scrollViewShadowNode)
        .children({
          Element<ParagraphShadowNode>()
            .reference(paragraphShadowNode)
            .children({
              Element<TextShadowNode>()
                .reference(textShadowNode),
              Element<RawTextShadowNode>()
                .reference(rawTextShadowNode)
            }),
          Element<ViewShadowNode>()
            .reference(viewShadowNode),
        });
  // clang-format on

  auto rootShadowNode = builder.build(element);

  std::shared_ptr<ShadowNode> shadowNodeForRawTextShadowNode{rawTextShadowNode};
  std::shared_ptr<ShadowNode> shadowNodeForTextShadowNode{textShadowNode};

  // Casting `nullptr` returns `nullptrs`.
  ABI46_0_0EXPECT_FALSE(traitCast<LayoutableShadowNode const *>(nullptr));
  ABI46_0_0EXPECT_FALSE(traitCast<YogaLayoutableShadowNode const *>(nullptr));

  // `ViewShadowNode` is `LayoutableShadowNode` and `YogaLayoutableShadowNode`.
  ABI46_0_0EXPECT_TRUE(traitCast<LayoutableShadowNode const *>(viewShadowNode.get()));
  ABI46_0_0EXPECT_TRUE(
      traitCast<YogaLayoutableShadowNode const *>(viewShadowNode.get()));
  ABI46_0_0EXPECT_NO_FATAL_FAILURE(
      traitCast<LayoutableShadowNode const &>(*viewShadowNode));
  ABI46_0_0EXPECT_NO_FATAL_FAILURE(
      traitCast<YogaLayoutableShadowNode const &>(*viewShadowNode));

  // `ScrollViewShadowNode` is `LayoutableShadowNode` and
  // `YogaLayoutableShadowNode`.
  ABI46_0_0EXPECT_TRUE(
      traitCast<LayoutableShadowNode const *>(scrollViewShadowNode.get()));
  ABI46_0_0EXPECT_TRUE(
      traitCast<YogaLayoutableShadowNode const *>(scrollViewShadowNode.get()));
  ABI46_0_0EXPECT_NO_FATAL_FAILURE(
      traitCast<LayoutableShadowNode const &>(*scrollViewShadowNode));
  ABI46_0_0EXPECT_NO_FATAL_FAILURE(
      traitCast<YogaLayoutableShadowNode const &>(*scrollViewShadowNode));

  // `ParagraphShadowNode` is `LayoutableShadowNode` and
  // `YogaLayoutableShadowNode`.
  ABI46_0_0EXPECT_TRUE(
      traitCast<LayoutableShadowNode const *>(paragraphShadowNode.get()));
  ABI46_0_0EXPECT_TRUE(
      traitCast<YogaLayoutableShadowNode const *>(paragraphShadowNode.get()));
  ABI46_0_0EXPECT_NO_FATAL_FAILURE(
      traitCast<LayoutableShadowNode const &>(*paragraphShadowNode));
  ABI46_0_0EXPECT_NO_FATAL_FAILURE(
      traitCast<YogaLayoutableShadowNode const &>(*paragraphShadowNode));

  // `TextShadowNode` is *not* `LayoutableShadowNode` nor
  // `YogaLayoutableShadowNode`.
  ABI46_0_0EXPECT_FALSE(traitCast<LayoutableShadowNode const *>(textShadowNode.get()));
  ABI46_0_0EXPECT_FALSE(
      traitCast<YogaLayoutableShadowNode const *>(textShadowNode.get()));
  ABI46_0_0EXPECT_DEATH_IF_SUPPORTED(
      traitCast<LayoutableShadowNode const &>(*textShadowNode), "");
  ABI46_0_0EXPECT_DEATH_IF_SUPPORTED(
      traitCast<YogaLayoutableShadowNode const &>(*textShadowNode), "");

  // `RawTextShadowNode` is *not* `LayoutableShadowNode` nor
  // `YogaLayoutableShadowNode`.
  ABI46_0_0EXPECT_FALSE(
      traitCast<LayoutableShadowNode const *>(rawTextShadowNode.get()));
  ABI46_0_0EXPECT_FALSE(
      traitCast<YogaLayoutableShadowNode const *>(rawTextShadowNode.get()));
  ABI46_0_0EXPECT_DEATH_IF_SUPPORTED(
      traitCast<LayoutableShadowNode const &>(*rawTextShadowNode), "");
  ABI46_0_0EXPECT_DEATH_IF_SUPPORTED(
      traitCast<YogaLayoutableShadowNode const &>(*rawTextShadowNode), "");

  // trait cast to `RawTextShadowNode` works on `RawTextShadowNode`
  // and not on TextShadowNode or ViewShadowNode
  ABI46_0_0EXPECT_TRUE(traitCast<RawTextShadowNode const *>(
      shadowNodeForRawTextShadowNode.get()));
  ABI46_0_0EXPECT_NO_FATAL_FAILURE(
      traitCast<RawTextShadowNode const &>(*shadowNodeForRawTextShadowNode));
  ABI46_0_0EXPECT_FALSE(
      traitCast<RawTextShadowNode const *>(shadowNodeForTextShadowNode.get()));
  ABI46_0_0EXPECT_DEATH_IF_SUPPORTED(
      traitCast<RawTextShadowNode const &>(*shadowNodeForTextShadowNode), "");
  ABI46_0_0EXPECT_FALSE(traitCast<RawTextShadowNode const *>(viewShadowNode.get()));
  ABI46_0_0EXPECT_DEATH_IF_SUPPORTED(
      traitCast<RawTextShadowNode const &>(*viewShadowNode), "");

  // trait cast to `TextShadowNode` works on `TextShadowNode`
  // and not on RawTextShadowNode or ViewShadowNode
  ABI46_0_0EXPECT_TRUE(
      traitCast<TextShadowNode const *>(shadowNodeForTextShadowNode.get()));
  ABI46_0_0EXPECT_NO_FATAL_FAILURE(
      traitCast<TextShadowNode const &>(*shadowNodeForTextShadowNode));
  ABI46_0_0EXPECT_FALSE(
      traitCast<TextShadowNode const *>(shadowNodeForRawTextShadowNode.get()));
  ABI46_0_0EXPECT_DEATH_IF_SUPPORTED(
      traitCast<TextShadowNode const &>(*shadowNodeForRawTextShadowNode), "");
  ABI46_0_0EXPECT_FALSE(traitCast<TextShadowNode const *>(viewShadowNode.get()));
  ABI46_0_0EXPECT_DEATH_IF_SUPPORTED(
      traitCast<TextShadowNode const &>(*viewShadowNode), "");
}
