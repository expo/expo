/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ConcreteShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0Element.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0testUtils.h>

#include "ABI49_0_0TestComponent.h"

using namespace ABI49_0_0facebook::ABI49_0_0React;

TEST(ConcreteShadowNodeTest, testSetStateData) {
  auto builder = simpleComponentBuilder();

  auto childShadowNode = std::shared_ptr<ViewShadowNode>{};

  auto element = Element<ScrollViewShadowNode>();

  auto shadowNode = builder.build(element);

  shadowNode->setStateData({{10, 11}, {{21, 22}, {301, 302}}, 0});

  ABI49_0_0EXPECT_NE(
      shadowNode->getState(), shadowNode->getFamily().getMostRecentState());

  shadowNode->setMounted(true);

  ABI49_0_0EXPECT_EQ(
      shadowNode->getState(), shadowNode->getFamily().getMostRecentState());

  auto stateData = shadowNode->getStateData();

  ABI49_0_0EXPECT_EQ(stateData.contentOffset.x, 10);
  ABI49_0_0EXPECT_EQ(stateData.contentOffset.y, 11);

  ABI49_0_0EXPECT_EQ(stateData.contentBoundingRect.origin.x, 21);
  ABI49_0_0EXPECT_EQ(stateData.contentBoundingRect.origin.y, 22);

  ABI49_0_0EXPECT_EQ(stateData.contentBoundingRect.size.width, 301);
  ABI49_0_0EXPECT_EQ(stateData.contentBoundingRect.size.height, 302);
}
