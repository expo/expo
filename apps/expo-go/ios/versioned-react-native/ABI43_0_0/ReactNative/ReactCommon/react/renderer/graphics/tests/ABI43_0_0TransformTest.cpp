/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <ABI43_0_0React/ABI43_0_0renderer/graphics/Transform.h>
#include <gtest/gtest.h>
#include <math.h>

using namespace ABI43_0_0facebook::ABI43_0_0React;

TEST(TransformTest, transformingSize) {
  auto size = ABI43_0_0facebook::ABI43_0_0React::Size{100, 200};
  auto scaledSize = size * Transform::Scale(0.5, 0.5, 1);

  ABI43_0_0EXPECT_EQ(scaledSize.width, 50);
  ABI43_0_0EXPECT_EQ(scaledSize.height, 100);
}

TEST(TransformTest, transformingPoint) {
  auto point = ABI43_0_0facebook::ABI43_0_0React::Point{100, 200};
  auto translatedPoint = point * Transform::Translate(-50, -100, 0);

  ABI43_0_0EXPECT_EQ(translatedPoint.x, 50);
  ABI43_0_0EXPECT_EQ(translatedPoint.y, 100);
}

TEST(TransformTest, scalingRect) {
  auto point = ABI43_0_0facebook::ABI43_0_0React::Point{100, 200};
  auto size = ABI43_0_0facebook::ABI43_0_0React::Size{300, 400};
  auto rect = ABI43_0_0facebook::ABI43_0_0React::Rect{point, size};

  auto transformedRect = rect * Transform::Scale(0.5, 0.5, 1);

  ABI43_0_0EXPECT_EQ(transformedRect.origin.x, 175);
  ABI43_0_0EXPECT_EQ(transformedRect.origin.y, 300);
  ABI43_0_0EXPECT_EQ(transformedRect.size.width, 150);
  ABI43_0_0EXPECT_EQ(transformedRect.size.height, 200);
}

TEST(TransformTest, rotatingRect) {
  auto point = ABI43_0_0facebook::ABI43_0_0React::Point{10, 10};
  auto size = ABI43_0_0facebook::ABI43_0_0React::Size{10, 10};
  auto rect = ABI43_0_0facebook::ABI43_0_0React::Rect{point, size};

  auto transformedRect = rect * Transform::RotateZ(M_PI_4);

  ASSERT_NEAR(transformedRect.origin.x, 7.9289, 0.0001);
  ASSERT_NEAR(transformedRect.origin.y, 7.9289, 0.0001);
  ASSERT_NEAR(transformedRect.size.width, 14.1421, 0.0001);
  ASSERT_NEAR(transformedRect.size.height, 14.1421, 0.0001);
}

TEST(TransformTest, scalingAndTranslatingRect) {
  auto point = ABI43_0_0facebook::ABI43_0_0React::Point{100, 200};
  auto size = ABI43_0_0facebook::ABI43_0_0React::Size{300, 400};
  auto rect = ABI43_0_0facebook::ABI43_0_0React::Rect{point, size};

  auto transformedRect =
      rect * Transform::Scale(0.5, 0.5, 1) * Transform::Translate(1, 1, 0);

  ABI43_0_0EXPECT_EQ(transformedRect.origin.x, 176);
  ABI43_0_0EXPECT_EQ(transformedRect.origin.y, 301);
  ABI43_0_0EXPECT_EQ(transformedRect.size.width, 150);
  ABI43_0_0EXPECT_EQ(transformedRect.size.height, 200);
}
