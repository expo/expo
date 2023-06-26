/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <exception>

#include <gtest/gtest.h>

#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorProviderRegistry.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewComponentDescriptor.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0ComponentBuilder.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0Element.h>

using namespace ABI49_0_0facebook::ABI49_0_0React;

TEST(ShadowNodeFamilyTest, sealObjectCorrectly) {
  /*
   * The structure:
   * <A>
   *  <AA>
   *    <AAA/>
   *  </AA>
   * </A>
   */
  ComponentDescriptorProviderRegistry componentDescriptorProviderRegistry{};
  auto eventDispatcher = EventDispatcher::Shared{};
  auto componentDescriptorRegistry =
      componentDescriptorProviderRegistry.createComponentDescriptorRegistry(
          ComponentDescriptorParameters{eventDispatcher, nullptr, nullptr});

  componentDescriptorProviderRegistry.add(
      concreteComponentDescriptorProvider<ViewComponentDescriptor>());

  auto builder = ComponentBuilder{componentDescriptorRegistry};

  auto shadowNodeAAA = std::shared_ptr<ViewShadowNode>{};
  auto shadowNodeAA = std::shared_ptr<ViewShadowNode>{};

  // clang-format off
  auto elementA =
      Element<ViewShadowNode>()
        .tag(1)
        .finalize([](ViewShadowNode &shadowNode){
          shadowNode.sealRecursive();
        })
        .children({
          Element<ViewShadowNode>()
            .tag(2)
            .reference(shadowNodeAA)
            .children({
              Element<ViewShadowNode>()
                .reference(shadowNodeAAA)
                .tag(3)
            })
        });
  auto elementB =
    Element<ViewShadowNode>()
      .tag(1)
      .finalize([](ViewShadowNode &shadowNode){
        shadowNode.sealRecursive();
      });
  // clang-format on

  auto shadowNodeA = builder.build(elementA);
  auto shadowNodeB = builder.build(elementB);

  // Negative case:
  auto ancestors1 = shadowNodeB->getFamily().getAncestors(*shadowNodeA);
  ABI49_0_0EXPECT_EQ(ancestors1.size(), 0);

  // Positive case:
  auto ancestors2 = shadowNodeAAA->getFamily().getAncestors(*shadowNodeA);
  ABI49_0_0EXPECT_EQ(ancestors2.size(), 2);
  ABI49_0_0EXPECT_EQ(&ancestors2[0].first.get(), shadowNodeA.get());
  ABI49_0_0EXPECT_EQ(&ancestors2[1].first.get(), shadowNodeAA.get());
}
