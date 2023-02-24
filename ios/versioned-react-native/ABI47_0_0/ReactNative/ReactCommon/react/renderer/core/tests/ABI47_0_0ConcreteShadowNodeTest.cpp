/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ConcreteShadowNode.h>
#include <ABI47_0_0React/ABI47_0_0renderer/core/ShadowNode.h>
#include <ABI47_0_0React/ABI47_0_0renderer/element/Element.h>
#include <ABI47_0_0React/ABI47_0_0renderer/element/testUtils.h>

#include "ABI47_0_0TestComponent.h"

using namespace ABI47_0_0facebook::ABI47_0_0React;

TEST(ConcreteShadowNodeTest, testSetStateData) {
  auto builder = simpleComponentBuilder();

  auto childShadowNode = std::shared_ptr<ViewShadowNode>{};

  auto element = Element<ScrollViewShadowNode>();

  auto shadowNode = builder.build(element);

  shadowNode->setStateData({{10, 11}, {{21, 22}, {301, 302}}, 0});

  ABI47_0_0EXPECT_NE(
      shadowNode->getState(), shadowNode->getFamily().getMostRecentState());

  shadowNode->setMounted(true);

  ABI47_0_0EXPECT_EQ(
      shadowNode->getState(), shadowNode->getFamily().getMostRecentState());

  auto stateData = shadowNode->getStateData();

  ABI47_0_0EXPECT_EQ(stateData.contentOffset.x, 10);
  ABI47_0_0EXPECT_EQ(stateData.contentOffset.y, 11);

  ABI47_0_0EXPECT_EQ(stateData.contentBoundingRect.origin.x, 21);
  ABI47_0_0EXPECT_EQ(stateData.contentBoundingRect.origin.y, 22);

  ABI47_0_0EXPECT_EQ(stateData.contentBoundingRect.size.width, 301);
  ABI47_0_0EXPECT_EQ(stateData.contentBoundingRect.size.height, 302);
}
