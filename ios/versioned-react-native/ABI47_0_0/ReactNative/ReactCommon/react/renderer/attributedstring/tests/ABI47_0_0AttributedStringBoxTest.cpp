/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <ABI47_0_0React/ABI47_0_0renderer/attributedstring/AttributedStringBox.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

TEST(AttributedStringBoxTest, testDefaultConstructor) {
  auto attributedStringBox = AttributedStringBox{};

  ABI47_0_0EXPECT_EQ(attributedStringBox.getMode(), AttributedStringBox::Mode::Value);
  ABI47_0_0EXPECT_EQ(attributedStringBox.getValue(), AttributedString{});
}

TEST(AttributedStringBoxTest, testValueConstructor) {
  auto attributedString = AttributedString{};
  auto fragment = AttributedString::Fragment{};
  fragment.string = "test string";
  attributedString.appendFragment(fragment);
  auto attributedStringBox = AttributedStringBox{attributedString};

  ABI47_0_0EXPECT_EQ(attributedStringBox.getMode(), AttributedStringBox::Mode::Value);
  ABI47_0_0EXPECT_EQ(attributedStringBox.getValue(), attributedString);
}

TEST(AttributedStringBoxTest, testOpaquePointerConstructor) {
  auto string = std::make_shared<std::string>("test string");
  auto attributedStringBox = AttributedStringBox{string};

  ABI47_0_0EXPECT_EQ(
      attributedStringBox.getMode(), AttributedStringBox::Mode::OpaquePointer);
  ABI47_0_0EXPECT_EQ(attributedStringBox.getOpaquePointer(), string);
  ABI47_0_0EXPECT_EQ(string.use_count(), 2);
}

TEST(AttributedStringBoxTest, testMoveConstructor) {
  {
    auto string = std::make_shared<std::string>("test string");
    auto movedFromAttributedStringBox = AttributedStringBox{string};

    auto moveToAttributedStringBox =
        AttributedStringBox{std::move(movedFromAttributedStringBox)};

    ABI47_0_0EXPECT_EQ(
        moveToAttributedStringBox.getMode(),
        AttributedStringBox::Mode::OpaquePointer);
    ABI47_0_0EXPECT_EQ(moveToAttributedStringBox.getOpaquePointer(), string);
    ABI47_0_0EXPECT_EQ(string.use_count(), 2);
  }
  {
    auto attributedString = AttributedString{};
    auto fragment = AttributedString::Fragment{};
    fragment.string = "test string";
    attributedString.appendFragment(fragment);
    auto movedFromAttributedStringBox = AttributedStringBox{attributedString};

    auto moveToAttributedStringBox =
        AttributedStringBox{std::move(movedFromAttributedStringBox)};

    ABI47_0_0EXPECT_EQ(
        moveToAttributedStringBox.getMode(), AttributedStringBox::Mode::Value);
    ABI47_0_0EXPECT_EQ(moveToAttributedStringBox.getValue(), attributedString);
  }
}

TEST(AttributedStringBoxTest, testMoveAssignment) {
  {
    auto string = std::make_shared<std::string>("test string");
    auto movedFromAttributedStringBox = AttributedStringBox{string};

    auto movedToAttributedStringBox = AttributedStringBox{};
    movedToAttributedStringBox = std::move(movedFromAttributedStringBox);

    ABI47_0_0EXPECT_EQ(
        movedToAttributedStringBox.getMode(),
        AttributedStringBox::Mode::OpaquePointer);
    ABI47_0_0EXPECT_EQ(movedToAttributedStringBox.getOpaquePointer(), string);
    ABI47_0_0EXPECT_EQ(string.use_count(), 2);
  }
  {
    auto attributedString = AttributedString{};
    auto fragment = AttributedString::Fragment{};
    fragment.string = "test string";
    attributedString.appendFragment(fragment);
    auto movedFromAttributedStringBox = AttributedStringBox{attributedString};

    auto moveToAttributedStringBox = AttributedStringBox{};
    moveToAttributedStringBox = std::move(movedFromAttributedStringBox);

    ABI47_0_0EXPECT_EQ(
        moveToAttributedStringBox.getMode(), AttributedStringBox::Mode::Value);
    ABI47_0_0EXPECT_EQ(moveToAttributedStringBox.getValue(), attributedString);
  }
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
