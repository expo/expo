/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <ABI43_0_0React/ABI43_0_0renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <ABI43_0_0React/ABI43_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI43_0_0React/ABI43_0_0renderer/components/view/ViewComponentDescriptor.h>
#include <ABI43_0_0React/ABI43_0_0renderer/element/ComponentBuilder.h>
#include <ABI43_0_0React/ABI43_0_0renderer/element/Element.h>
#include <ABI43_0_0React/ABI43_0_0renderer/element/testUtils.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

//  *******************************************************┌─ABCD:────┐****
//  *******************************************************│ {70,-50} │****
//  *******************************************************│ {30,60}  │****
//  *******************************************************│          │****
//  *******************************************************│          │****
//  *******************┌─A: {0,0}{50,50}──┐****************│          │****
//  *******************│                  │****************│          │****
//  *******************│   ┌─AB:──────┐   │****************│          │****
//  *******************│   │ {10,10}{30,90}****************│          │****
//  *******************│   │   ┌─ABC: {10,10}{110,20}──────┤          ├───┐
//  *******************│   │   │                           │          │   │
//  *******************│   │   │                           └──────────┘   │
//  *******************│   │   └──────┬───┬───────────────────────────────┘
//  *******************│   │          │   │********************************
//  *******************└───┤          ├───┘********************************
//  ***********************│          │************************************
//  ***********************│          │************************************
//  ┌─ABE: {-60,50}{70,20}─┴───┐      │************************************
//  │                          │      │************************************
//  │                          │      │************************************
//  │                          │      │************************************
//  │                          │      │************************************
//  └──────────────────────┬───┘      │************************************
//  ***********************│          │************************************
//  ***********************└──────────┘************************************

class LayoutTest : public ::testing::Test {
 protected:
  ComponentBuilder builder_;
  std::shared_ptr<RootShadowNode> rootShadowNode_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeA_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeAB_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeABC_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeABCD_;
  std::shared_ptr<ViewShadowNode> viewShadowNodeABE_;

  LayoutTest() : builder_(simpleComponentBuilder()) {}

  void initialize(bool enforceClippingForABC) {
    // clang-format off
    auto element =
        Element<RootShadowNode>()
          .reference(rootShadowNode_)
          .tag(1)
          .props([] {
            auto sharedProps = std::make_shared<RootProps>();
            auto &props = *sharedProps;
            props.layoutConstraints = LayoutConstraints{{0,0}, {500, 500}};
            auto &yogaStyle = props.yogaStyle;
            yogaStyle.dimensions()[ABI43_0_0YGDimensionWidth] = ABI43_0_0YGValue{200, ABI43_0_0YGUnitPoint};
            yogaStyle.dimensions()[ABI43_0_0YGDimensionHeight] = ABI43_0_0YGValue{200, ABI43_0_0YGUnitPoint};
            return sharedProps;
          })
          .children({
            Element<ViewShadowNode>()
              .reference(viewShadowNodeA_)
              .props([] {
                auto sharedProps = std::make_shared<ViewProps>();
                auto &props = *sharedProps;
                auto &yogaStyle = props.yogaStyle;
                yogaStyle.positionType() = ABI43_0_0YGPositionTypeAbsolute;
                yogaStyle.dimensions()[ABI43_0_0YGDimensionWidth] = ABI43_0_0YGValue{50, ABI43_0_0YGUnitPoint};
                yogaStyle.dimensions()[ABI43_0_0YGDimensionHeight] = ABI43_0_0YGValue{50, ABI43_0_0YGUnitPoint};
                return sharedProps;
              })
              .children({
                Element<ViewShadowNode>()
                  .reference(viewShadowNodeAB_)
                  .props([] {
                    auto sharedProps = std::make_shared<ViewProps>();
                    auto &props = *sharedProps;
                    auto &yogaStyle = props.yogaStyle;
                    yogaStyle.positionType() = ABI43_0_0YGPositionTypeAbsolute;
                    yogaStyle.position()[ABI43_0_0YGEdgeLeft] = ABI43_0_0YGValue{10, ABI43_0_0YGUnitPoint};
                    yogaStyle.position()[ABI43_0_0YGEdgeTop] = ABI43_0_0YGValue{10, ABI43_0_0YGUnitPoint};
                    yogaStyle.dimensions()[ABI43_0_0YGDimensionWidth] = ABI43_0_0YGValue{30, ABI43_0_0YGUnitPoint};
                    yogaStyle.dimensions()[ABI43_0_0YGDimensionHeight] = ABI43_0_0YGValue{90, ABI43_0_0YGUnitPoint};
                    return sharedProps;
                  })
                  .children({
                    Element<ViewShadowNode>()
                      .reference(viewShadowNodeABC_)
                      .props([=] {
                        auto sharedProps = std::make_shared<ViewProps>();
                        auto &props = *sharedProps;
                        auto &yogaStyle = props.yogaStyle;

                        if (enforceClippingForABC) {
                          yogaStyle.overflow() = ABI43_0_0YGOverflowHidden;
                        }

                        yogaStyle.positionType() = ABI43_0_0YGPositionTypeAbsolute;
                        yogaStyle.position()[ABI43_0_0YGEdgeLeft] = ABI43_0_0YGValue{10, ABI43_0_0YGUnitPoint};
                        yogaStyle.position()[ABI43_0_0YGEdgeTop] = ABI43_0_0YGValue{10, ABI43_0_0YGUnitPoint};
                        yogaStyle.dimensions()[ABI43_0_0YGDimensionWidth] = ABI43_0_0YGValue{110, ABI43_0_0YGUnitPoint};
                        yogaStyle.dimensions()[ABI43_0_0YGDimensionHeight] = ABI43_0_0YGValue{20, ABI43_0_0YGUnitPoint};
                        return sharedProps;
                      })
                      .children({
                        Element<ViewShadowNode>()
                          .reference(viewShadowNodeABCD_)
                          .props([] {
                            auto sharedProps = std::make_shared<ViewProps>();
                            auto &props = *sharedProps;
                            auto &yogaStyle = props.yogaStyle;
                            yogaStyle.positionType() = ABI43_0_0YGPositionTypeAbsolute;
                            yogaStyle.position()[ABI43_0_0YGEdgeLeft] = ABI43_0_0YGValue{70, ABI43_0_0YGUnitPoint};
                            yogaStyle.position()[ABI43_0_0YGEdgeTop] = ABI43_0_0YGValue{-50, ABI43_0_0YGUnitPoint};
                            yogaStyle.dimensions()[ABI43_0_0YGDimensionWidth] = ABI43_0_0YGValue{30, ABI43_0_0YGUnitPoint};
                            yogaStyle.dimensions()[ABI43_0_0YGDimensionHeight] = ABI43_0_0YGValue{60, ABI43_0_0YGUnitPoint};
                            return sharedProps;
                          })
                      }),
                    Element<ViewShadowNode>()
                      .reference(viewShadowNodeABE_)
                      .props([] {
                        auto sharedProps = std::make_shared<ViewProps>();
                        auto &props = *sharedProps;
                        auto &yogaStyle = props.yogaStyle;
                        yogaStyle.positionType() = ABI43_0_0YGPositionTypeAbsolute;
                        yogaStyle.position()[ABI43_0_0YGEdgeLeft] = ABI43_0_0YGValue{-60, ABI43_0_0YGUnitPoint};
                        yogaStyle.position()[ABI43_0_0YGEdgeTop] = ABI43_0_0YGValue{50, ABI43_0_0YGUnitPoint};
                        yogaStyle.dimensions()[ABI43_0_0YGDimensionWidth] = ABI43_0_0YGValue{70, ABI43_0_0YGUnitPoint};
                        yogaStyle.dimensions()[ABI43_0_0YGDimensionHeight] = ABI43_0_0YGValue{20, ABI43_0_0YGUnitPoint};
                        return sharedProps;
                      })
                  })
              })
          });
    // clang-format on

    builder_.build(element);

    rootShadowNode_->layoutIfNeeded();
  }
};

TEST_F(LayoutTest, overflowInsetTest) {
  initialize(false);

  auto layoutMetrics = viewShadowNodeA_->getLayoutMetrics();

  ABI43_0_0EXPECT_EQ(layoutMetrics.frame.size.width, 50);
  ABI43_0_0EXPECT_EQ(layoutMetrics.frame.size.height, 50);

  ABI43_0_0EXPECT_EQ(layoutMetrics.overflowInset.left, -50);
  ABI43_0_0EXPECT_EQ(layoutMetrics.overflowInset.top, -30);
  ABI43_0_0EXPECT_EQ(layoutMetrics.overflowInset.right, -80);
  ABI43_0_0EXPECT_EQ(layoutMetrics.overflowInset.bottom, -50);
}

TEST_F(LayoutTest, overflowInsetWithClippingTest) {
  initialize(true);

  auto layoutMetrics = viewShadowNodeA_->getLayoutMetrics();

  ABI43_0_0EXPECT_EQ(layoutMetrics.frame.size.width, 50);
  ABI43_0_0EXPECT_EQ(layoutMetrics.frame.size.height, 50);

  ABI43_0_0EXPECT_EQ(layoutMetrics.overflowInset.left, -50);
  ABI43_0_0EXPECT_EQ(layoutMetrics.overflowInset.top, 0);
  ABI43_0_0EXPECT_EQ(layoutMetrics.overflowInset.right, -80);
  ABI43_0_0EXPECT_EQ(layoutMetrics.overflowInset.bottom, -50);
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
