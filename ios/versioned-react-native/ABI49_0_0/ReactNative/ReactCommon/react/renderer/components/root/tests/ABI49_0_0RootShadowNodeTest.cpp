/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI49_0_0React/ABI49_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0ComponentBuilder.h>

#include <gtest/gtest.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0Element.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0testUtils.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

TEST(RootShadowNodeTest, cloneWithLayoutConstraints) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  auto builder = simpleComponentBuilder();
  std::shared_ptr<RootShadowNode> rootShadowNode;
  LayoutConstraints defaultLayoutConstraints = {};

  auto element =
      Element<RootShadowNode>().reference(rootShadowNode).tag(1).props([&] {
        auto sharedProps = std::make_shared<RootProps>();
        sharedProps->layoutConstraints = defaultLayoutConstraints;
        return sharedProps;
      });

  builder.build(element);

  ABI49_0_0EXPECT_FALSE(rootShadowNode->getIsLayoutClean());
  ABI49_0_0EXPECT_TRUE(rootShadowNode->layoutIfNeeded());
  ABI49_0_0EXPECT_TRUE(rootShadowNode->getIsLayoutClean());

  auto clonedWithDifferentLayoutConstraints = rootShadowNode->clone(
      parserContext, LayoutConstraints{{0, 0}, {10, 10}}, {});

  ABI49_0_0EXPECT_FALSE(clonedWithDifferentLayoutConstraints->getIsLayoutClean());
  ABI49_0_0EXPECT_TRUE(clonedWithDifferentLayoutConstraints->layoutIfNeeded());
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
