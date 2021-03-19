/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>

#include <ABI41_0_0React/components/root/RootComponentDescriptor.h>
#include <ABI41_0_0React/components/view/ViewComponentDescriptor.h>
#include <ABI41_0_0React/element/ComponentBuilder.h>
#include <ABI41_0_0React/element/Element.h>
#include <ABI41_0_0React/element/testUtils.h>
#include <ABI41_0_0React/uimanager/ComponentDescriptorProviderRegistry.h>

using namespace ABI41_0_0facebook::ABI41_0_0React;

TEST(ElementTest, testNormalCases) {
  auto builder = simpleComponentBuilder();

  auto shadowNodeA = std::shared_ptr<RootShadowNode>{};
  auto shadowNodeAA = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeAB = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeABA = std::shared_ptr<ViewShadowNode>{};

  auto propsAA = std::make_shared<ViewProps>();
  propsAA->nativeId = "node AA";

  // clang-format off
  auto element =
      Element<RootShadowNode>()
        .reference(shadowNodeA)
        .tag(1)
        .props([]() {
          auto props = std::make_shared<RootProps>();
          props->nativeId = "node A";
          return props;
        })
        .finalize([](RootShadowNode &shadowNode){
          shadowNode.sealRecursive();
        })
        .children({
          Element<ViewShadowNode>()
            .reference(shadowNodeAA)
            .tag(2)
            .props(propsAA),
          Element<ViewShadowNode>()
            .reference(shadowNodeAB)
            .tag(3)
            .props([]() {
               auto props = std::make_shared<ViewProps>();
               props->nativeId = "node AB";
               return props;
            })
            .children({
              Element<ViewShadowNode>()
                .reference(shadowNodeABA)
                .tag(4)
                .props([]() {
                  auto props = std::make_shared<ViewProps>();
                  props->nativeId = "node ABA";
                  return props;
                })
            })
        });
  // clang-format on

  auto shadowNode = builder.build(element);

  ABI41_0_0EXPECT_EQ(shadowNode, shadowNodeA);

  // Tags
  ABI41_0_0EXPECT_EQ(shadowNodeA->getTag(), 1);
  ABI41_0_0EXPECT_EQ(shadowNodeAA->getTag(), 2);
  ABI41_0_0EXPECT_EQ(shadowNodeAB->getTag(), 3);
  ABI41_0_0EXPECT_EQ(shadowNodeABA->getTag(), 4);

  // Children
  ABI41_0_0EXPECT_EQ(shadowNodeA->getChildren().size(), 2);
  ABI41_0_0EXPECT_EQ(shadowNodeAA->getChildren().size(), 0);
  ABI41_0_0EXPECT_EQ(shadowNodeAB->getChildren().size(), 1);
  ABI41_0_0EXPECT_EQ(shadowNodeABA->getChildren().size(), 0);
  ABI41_0_0EXPECT_EQ(
      shadowNodeA->getChildren(),
      (ShadowNode::ListOfShared{shadowNodeAA, shadowNodeAB}));
  ABI41_0_0EXPECT_EQ(
      shadowNodeAB->getChildren(), (ShadowNode::ListOfShared{shadowNodeABA}));

  // Props
  ABI41_0_0EXPECT_EQ(shadowNodeA->getProps()->nativeId, "node A");
  ABI41_0_0EXPECT_EQ(shadowNodeABA->getProps()->nativeId, "node ABA");
  ABI41_0_0EXPECT_EQ(shadowNodeAA->getProps(), propsAA);

  // Finalize
  ABI41_0_0EXPECT_TRUE(shadowNodeA->getSealed());
  ABI41_0_0EXPECT_TRUE(shadowNodeAA->getSealed());
  ABI41_0_0EXPECT_TRUE(shadowNodeAB->getSealed());
  ABI41_0_0EXPECT_TRUE(shadowNodeABA->getSealed());
}
