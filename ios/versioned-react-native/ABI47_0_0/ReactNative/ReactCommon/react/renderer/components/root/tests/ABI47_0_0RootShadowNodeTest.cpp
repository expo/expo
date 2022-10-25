/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI47_0_0React/ABI47_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/PropsParserContext.h>
#include <ABI47_0_0React/ABI47_0_0renderer/element/ComponentBuilder.h>

#include <gtest/gtest.h>
#include <ABI47_0_0React/ABI47_0_0renderer/element/Element.h>
#include <ABI47_0_0React/ABI47_0_0renderer/element/testUtils.h>

namespace ABI47_0_0facebook::ABI47_0_0React {

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

  ABI47_0_0EXPECT_FALSE(rootShadowNode->getIsLayoutClean());
  ABI47_0_0EXPECT_TRUE(rootShadowNode->layoutIfNeeded());
  ABI47_0_0EXPECT_TRUE(rootShadowNode->getIsLayoutClean());

  auto clonedWithDiffentLayoutConstraints = rootShadowNode->clone(
      parserContext, LayoutConstraints{{0, 0}, {10, 10}}, {});

  ABI47_0_0EXPECT_FALSE(clonedWithDiffentLayoutConstraints->getIsLayoutClean());
  ABI47_0_0EXPECT_TRUE(clonedWithDiffentLayoutConstraints->layoutIfNeeded());
}

} // namespace ABI47_0_0facebook::ABI47_0_0React
