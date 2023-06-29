/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorProviderRegistry.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/root/RootComponentDescriptor.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewComponentDescriptor.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0ComponentBuilder.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0Element.h>
#include <ABI49_0_0React/renderer/element/ABI49_0_0testUtils.h>

namespace ABI49_0_0facebook::ABI49_0_0React {

// Note: the (x, y) origin is always relative to the parent node. You may use
// P482342650 to re-create this test case in playground.

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

enum TestCase {
  AS_IS,
  CLIPPING,
  HIT_SLOP,
  HIT_SLOP_TRANSFORM_TRANSLATE,
  TRANSFORM_SCALE,
  TRANSFORM_TRANSLATE,
};

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

  void initialize(TestCase testCase) {
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
            yogaStyle.dimensions()[ABI49_0_0YGDimensionWidth] = ABI49_0_0YGValue{200, ABI49_0_0YGUnitPoint};
            yogaStyle.dimensions()[ABI49_0_0YGDimensionHeight] = ABI49_0_0YGValue{200, ABI49_0_0YGUnitPoint};
            return sharedProps;
          })
          .children({
            Element<ViewShadowNode>()
              .reference(viewShadowNodeA_)
              .tag(2)
              .props([] {
                auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                auto &props = *sharedProps;
                auto &yogaStyle = props.yogaStyle;
                yogaStyle.positionType() = ABI49_0_0YGPositionTypeAbsolute;
                yogaStyle.dimensions()[ABI49_0_0YGDimensionWidth] = ABI49_0_0YGValue{50, ABI49_0_0YGUnitPoint};
                yogaStyle.dimensions()[ABI49_0_0YGDimensionHeight] = ABI49_0_0YGValue{50, ABI49_0_0YGUnitPoint};
                return sharedProps;
              })
              .children({
                Element<ViewShadowNode>()
                  .reference(viewShadowNodeAB_)
                  .tag(3)
                  .props([=] {
                    auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                    auto &props = *sharedProps;
                    auto &yogaStyle = props.yogaStyle;
                    yogaStyle.positionType() = ABI49_0_0YGPositionTypeAbsolute;
                    yogaStyle.position()[ABI49_0_0YGEdgeLeft] = ABI49_0_0YGValue{10, ABI49_0_0YGUnitPoint};
                    yogaStyle.position()[ABI49_0_0YGEdgeTop] = ABI49_0_0YGValue{10, ABI49_0_0YGUnitPoint};
                    yogaStyle.dimensions()[ABI49_0_0YGDimensionWidth] = ABI49_0_0YGValue{30, ABI49_0_0YGUnitPoint};
                    yogaStyle.dimensions()[ABI49_0_0YGDimensionHeight] = ABI49_0_0YGValue{90, ABI49_0_0YGUnitPoint};

                    if (testCase == TRANSFORM_SCALE) {
                      props.transform = props.transform * Transform::Scale(2, 2, 1);
                    }

                    if (testCase == TRANSFORM_TRANSLATE || testCase == HIT_SLOP_TRANSFORM_TRANSLATE) {
                      props.transform = props.transform * Transform::Translate(10, 10, 0);
                    }

                    if (testCase == HIT_SLOP || testCase == HIT_SLOP_TRANSFORM_TRANSLATE) {
                      props.hitSlop = EdgeInsets{50, 50, 50, 50};
                    }

                    return sharedProps;
                  })
                  .children({
                    Element<ViewShadowNode>()
                      .reference(viewShadowNodeABC_)
                      .tag(4)
                      .props([=] {
                        auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                        auto &props = *sharedProps;
                        auto &yogaStyle = props.yogaStyle;

                        if (testCase == CLIPPING) {
                          yogaStyle.overflow() = ABI49_0_0YGOverflowHidden;
                        }

                        yogaStyle.positionType() = ABI49_0_0YGPositionTypeAbsolute;
                        yogaStyle.position()[ABI49_0_0YGEdgeLeft] = ABI49_0_0YGValue{10, ABI49_0_0YGUnitPoint};
                        yogaStyle.position()[ABI49_0_0YGEdgeTop] = ABI49_0_0YGValue{10, ABI49_0_0YGUnitPoint};
                        yogaStyle.dimensions()[ABI49_0_0YGDimensionWidth] = ABI49_0_0YGValue{110, ABI49_0_0YGUnitPoint};
                        yogaStyle.dimensions()[ABI49_0_0YGDimensionHeight] = ABI49_0_0YGValue{20, ABI49_0_0YGUnitPoint};
                        return sharedProps;
                      })
                      .children({
                        Element<ViewShadowNode>()
                          .reference(viewShadowNodeABCD_)
                          .tag(5)
                          .props([] {
                            auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                            auto &props = *sharedProps;
                            auto &yogaStyle = props.yogaStyle;
                            yogaStyle.positionType() = ABI49_0_0YGPositionTypeAbsolute;
                            yogaStyle.position()[ABI49_0_0YGEdgeLeft] = ABI49_0_0YGValue{70, ABI49_0_0YGUnitPoint};
                            yogaStyle.position()[ABI49_0_0YGEdgeTop] = ABI49_0_0YGValue{-50, ABI49_0_0YGUnitPoint};
                            yogaStyle.dimensions()[ABI49_0_0YGDimensionWidth] = ABI49_0_0YGValue{30, ABI49_0_0YGUnitPoint};
                            yogaStyle.dimensions()[ABI49_0_0YGDimensionHeight] = ABI49_0_0YGValue{60, ABI49_0_0YGUnitPoint};
                            return sharedProps;
                          })
                      }),
                    Element<ViewShadowNode>()
                      .reference(viewShadowNodeABE_)
                      .tag(6)
                      .props([] {
                        auto sharedProps = std::make_shared<ViewShadowNodeProps>();
                        auto &props = *sharedProps;
                        auto &yogaStyle = props.yogaStyle;
                        yogaStyle.positionType() = ABI49_0_0YGPositionTypeAbsolute;
                        yogaStyle.position()[ABI49_0_0YGEdgeLeft] = ABI49_0_0YGValue{-60, ABI49_0_0YGUnitPoint};
                        yogaStyle.position()[ABI49_0_0YGEdgeTop] = ABI49_0_0YGValue{50, ABI49_0_0YGUnitPoint};
                        yogaStyle.dimensions()[ABI49_0_0YGDimensionWidth] = ABI49_0_0YGValue{70, ABI49_0_0YGUnitPoint};
                        yogaStyle.dimensions()[ABI49_0_0YGDimensionHeight] = ABI49_0_0YGValue{20, ABI49_0_0YGUnitPoint};
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

// Test the layout as described above with no extra changes
TEST_F(LayoutTest, overflowInsetTest) {
  initialize(AS_IS);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.left, -50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.top, -30);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.right, -80);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -50);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.top, -50);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

// Test when box ABC has clipping (aka overflow hidden)
TEST_F(LayoutTest, overflowInsetWithClippingTest) {
  initialize(CLIPPING);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.left, -50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.top, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.right, -80);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -50);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.top, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

// Test when box AB translate (10, 10, 0) in transform. The parent node's
// overflowInset will be affected, but the transformed node and its child nodes
// are not affected. Here is an example:
//
//      ┌────────────────┐                  ┌────────────────┐
//      │Original Layout │                  │  Translate AB  │
//      └────────────────┘                  └────────────────┘
//                                                          ─────▶
// ┌ ─ ─ ─ ┬──────────┐─ ─ ─ ─ ┐      ┌ ─ ─ ─ ┬──────────┐─ ─ ─ ─ ─ ┐
//         │ A        │                       │ A        │
// │       │          │        │      │       │          │          │
//  ─ ─ ─ ─│─ ─ ─┌───┐┼ ─ ─ ─ ─               │          │
// │       │     │AB ││        │      │ ┌ ─ ─ ┼ ─ ─ ─ ┬──┴┬ ─ ─ ─ ─ ┤
//         └─────┤   ├┘                       └───────┤AB │
// │             │┌──┴─────────┤      │ │             │   │         │
//               ││ABC         │                      │┌──┴─────────┐
// │             │└──┬─────────┤    │ │ │             ││ABC         │
// ┌───ABD───────┴─┐ │              │                 │└──┬─────────┘
// ├─────────────┬─┘ │         │    │ │ ├───ABD───────┴─┐ │         │
//  ─ ─ ─ ─ ─ ─ ─└───┘─ ─ ─ ─ ─     ▼   └─────────────┬─┘ │
//                                    └ ┴ ─ ─ ─ ─ ─ ─ ┴───┴ ─ ─ ─ ─ ┘

TEST_F(LayoutTest, overflowInsetTransformTranslateTest) {
  initialize(TRANSFORM_TRANSLATE);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  // Change on parent node
  // The top/left values are NOT changing as overflowInset is union of before
  // and after transform layout. In this case, we move to the right and bottom,
  // so the left and top is not changing, while right and bottom values are
  // increased.
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.left, -50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.top, -30);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.right, -90);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -60);

  auto layoutMetricsAB = viewShadowNodeAB_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsAB.frame.size.width, 30);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.frame.size.height, 90);

  // No change on self node with translate transform
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.left, -60);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.top, -40);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.right, -90);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.bottom, 0);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  // No change on child node
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.top, -50);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

// Test when box AB scaled 2X in transform. The parent node's overflowInset will
// be affected. However, the transformed node and its child nodes only appears
// to be affected (dashed arrow). Since all transform is cosmetic only, the
// actual values are NOT changed. It will be converted later when mapping the
// values to pixels during rendering. Here is an example:
//
//      ┌────────────────┐                    ┌────────────────┐
//      │Original Layout │                    │    Scale AB    │
//      └────────────────┘                    └────────────────┘
//                                                             ─────▶
// ┌ ─ ─ ─ ┬──────────┐─ ─ ─ ─ ┐     ┌ ─ ─ ─ ─ ─ ┬──────────┐─ ─ ─ ─ ─ ┐
//         │ A        │                          │ A        │
// │       │          │        │     ├ ─ ─ ─ ─ ─ ┼ ─ ─┌─────┤─ ─ ─ ─ ─ ┤
//  ─ ─ ─ ─│─ ─ ─┌───┐┼ ─ ─ ─ ─                  │    │AB   │  ─ ─ ─▶
// │       │     │AB ││        │     │           │    │     │          │
//         └─────┤   ├┘                          └────┤     │
// │             │┌──┴─────────┤     │                │ ┌───┴──────────┤
//               ││ABC         │                      │ │ABC           │
// │             │└──┬─────────┤   │ │                │ │              │
// ┌───ABD───────┴─┐ │             │                  │ └───┬──────────┘
// ├─────────────┬─┘ │         │   │ ├────────────────┴──┐  │          │
//  ─ ─ ─ ─ ─ ─ ─└───┘─ ─ ─ ─ ─    ▼ │      ABD          │  │
//                                   ├────────────────┬──┘  │          │
//                                    ─ ─ ─ ─ ─ ─ ─ ─ ┴─────┴ ─ ─ ─ ─ ─

TEST_F(LayoutTest, overflowInsetTransformScaleTest) {
  initialize(TRANSFORM_SCALE);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  // Change on parent node when a child view scale up
  // Note that AB scale up from its center point. The numbers are calculated
  // assuming AB's center point is not moving.
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.left, -125);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.top, -115);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.right, -185);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -95);

  auto layoutMetricsAB = viewShadowNodeAB_->getLayoutMetrics();

  // The frame of box AB won't actually scale up. The transform matrix is
  // purely cosmetic and should apply later in mounting phase.
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.frame.size.width, 30);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.frame.size.height, 90);

  // No change on self node with scale transform. This may sound a bit
  // surprising, but the overflowInset values will be scaled up via pixel
  // density ratio along with width/height of the view. When we do hit-testing,
  // the overflowInset value will appears to be doubled as expected.
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.left, -60);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.top, -40);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.right, -90);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.bottom, 0);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  // The frame of box ABC won't actually scale up. The transform matrix is
  // purely cosmatic and should apply later in mounting phase.
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  // The overflowInset of ABC won't change either. This may sound a bit
  // surprising, but the overflowInset values will be scaled up via pixel
  // density ratio along with width/height of the view. When we do hit-testing,
  // the overflowInset value will appears to be doubled as expected.
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.top, -50);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

TEST_F(LayoutTest, overflowInsetHitSlopTest) {
  initialize(HIT_SLOP);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  // Change on parent node
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.left, -50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.top, -40);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.right, -80);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -100);

  auto layoutMetricsAB = viewShadowNodeAB_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsAB.frame.size.width, 30);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.frame.size.height, 90);

  // No change on self node
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.left, -60);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.top, -40);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.right, -90);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.bottom, 0);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  // No change on child node
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.top, -50);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

TEST_F(LayoutTest, overflowInsetHitSlopTransformTranslateTest) {
  initialize(HIT_SLOP_TRANSFORM_TRANSLATE);

  auto layoutMetricsA = viewShadowNodeA_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.width, 50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.frame.size.height, 50);

  // Change on parent node
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.left, -50);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.top, -40);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.right, -90);
  ABI49_0_0EXPECT_EQ(layoutMetricsA.overflowInset.bottom, -110);

  auto layoutMetricsAB = viewShadowNodeAB_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsAB.frame.size.width, 30);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.frame.size.height, 90);

  // No change on self node
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.left, -60);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.top, -40);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.right, -90);
  ABI49_0_0EXPECT_EQ(layoutMetricsAB.overflowInset.bottom, 0);

  auto layoutMetricsABC = viewShadowNodeABC_->getLayoutMetrics();

  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.width, 110);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.frame.size.height, 20);

  // No change on child node
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.left, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.top, -50);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.right, 0);
  ABI49_0_0EXPECT_EQ(layoutMetricsABC.overflowInset.bottom, 0);
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
