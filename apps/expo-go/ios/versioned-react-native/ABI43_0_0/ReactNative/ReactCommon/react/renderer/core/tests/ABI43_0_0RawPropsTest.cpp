/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ConcreteShadowNode.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/ShadowNode.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/propsConversions.h>

#include "ABI43_0_0TestComponent.h"

using namespace ABI43_0_0facebook::ABI43_0_0React;

class PropsSingleFloat : public Props {
 public:
  PropsSingleFloat() = default;
  PropsSingleFloat(
      const PropsSingleFloat &sourceProps,
      const RawProps &rawProps)
      : floatValue(convertRawProp(
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            17.5)) {}

 private:
  const float floatValue{17.5};
};

class PropsSingleDouble : public Props {
 public:
  PropsSingleDouble() = default;
  PropsSingleDouble(
      const PropsSingleDouble &sourceProps,
      const RawProps &rawProps)
      : doubleValue(convertRawProp(
            rawProps,
            "doubleValue",
            sourceProps.doubleValue,
            17.5)) {}

 private:
  const float doubleValue{17.5};
};

class PropsSingleInt : public Props {
 public:
  PropsSingleInt() = default;
  PropsSingleInt(const PropsSingleInt &sourceProps, const RawProps &rawProps)
      : intValue(
            convertRawProp(rawProps, "intValue", sourceProps.intValue, 17)) {}

 private:
  const int intValue{17};
};

class PropsPrimitiveTypes : public Props {
 public:
  PropsPrimitiveTypes() = default;
  PropsPrimitiveTypes(
      const PropsPrimitiveTypes &sourceProps,
      const RawProps &rawProps)
      : intValue(
            convertRawProp(rawProps, "intValue", sourceProps.intValue, 17)),
        doubleValue(convertRawProp(
            rawProps,
            "doubleValue",
            sourceProps.doubleValue,
            17.56)),
        floatValue(convertRawProp(
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            56.75)),
        stringValue(convertRawProp(
            rawProps,
            "stringValue",
            sourceProps.stringValue,
            "")),
        boolValue(convertRawProp(
            rawProps,
            "boolValue",
            sourceProps.boolValue,
            false)) {}

 private:
  const int intValue{17};
  const double doubleValue{17.56};
  const float floatValue{56.75};
  const std::string stringValue{};
  const bool boolValue{false};
};

class PropsMultiLookup : public Props {
 public:
  PropsMultiLookup() = default;
  PropsMultiLookup(
      const PropsMultiLookup &sourceProps,
      const RawProps &rawProps)
      : floatValue(convertRawProp(
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            17.5)),
        // While this specific pattern is uncommon, it's a simplication of a
        // pattern that does occur a lot: nested structs that access props we
        // have already accessed populating Props
        derivedFloatValue(
            convertRawProp(rawProps, "floatValue", sourceProps.floatValue, 40) *
            2) {}

  const float floatValue{17.5};
  const float derivedFloatValue{40};
};

TEST(RawPropsTest, handleProps) {
  const auto &raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  auto parser = RawPropsParser();
  parser.prepare<Props>();
  raw.parse(parser);

  auto props = std::make_shared<Props>(Props(), raw);

  // Props are not sealed after applying raw props.
  ABI43_0_0EXPECT_FALSE(props->getSealed());

  ABI43_0_0EXPECT_STREQ(props->nativeId.c_str(), "abc");
}

TEST(RawPropsTest, handleRawPropsSingleString) {
  const auto &raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  auto parser = RawPropsParser();
  parser.prepare<Props>();
  raw.parse(parser);

  std::string value = (std::string)*raw.at("nativeID", nullptr, nullptr);

  ABI43_0_0EXPECT_STREQ(value.c_str(), "abc");
}

TEST(RawPropsTest, handleRawPropsSingleFloat) {
  const auto &raw =
      RawProps(folly::dynamic::object("floatValue", (float)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleFloat>();
  raw.parse(parser);

  float value = (float)*raw.at("floatValue", nullptr, nullptr);

  ABI43_0_0EXPECT_NEAR(value, 42.42, 0.00001);
}

TEST(RawPropsTest, handleRawPropsSingleDouble) {
  const auto &raw =
      RawProps(folly::dynamic::object("doubleValue", (double)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleDouble>();
  raw.parse(parser);

  double value = (double)*raw.at("doubleValue", nullptr, nullptr);

  ABI43_0_0EXPECT_NEAR(value, 42.42, 0.00001);
}

TEST(RawPropsTest, handleRawPropsSingleInt) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleInt>();
  raw.parse(parser);

  int value = (int)*raw.at("intValue", nullptr, nullptr);

  ABI43_0_0EXPECT_EQ(value, 42);
}

TEST(RawPropsTest, handleRawPropsSingleIntGetManyTimes) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleInt>();
  raw.parse(parser);

  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypes) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42)(
      "doubleValue", (double)17.42)("floatValue", (float)66.67)(
      "stringValue", "helloworld")("boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI43_0_0EXPECT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ABI43_0_0EXPECT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ABI43_0_0EXPECT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ABI43_0_0EXPECT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypesGetTwice) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42)(
      "doubleValue", (double)17.42)("floatValue", (float)66.67)(
      "stringValue", "helloworld")("boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI43_0_0EXPECT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ABI43_0_0EXPECT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ABI43_0_0EXPECT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ABI43_0_0EXPECT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);

  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI43_0_0EXPECT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ABI43_0_0EXPECT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ABI43_0_0EXPECT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ABI43_0_0EXPECT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypesGetOutOfOrder) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42)(
      "doubleValue", (double)17.42)("floatValue", (float)66.67)(
      "stringValue", "helloworld")("boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI43_0_0EXPECT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ABI43_0_0EXPECT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ABI43_0_0EXPECT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ABI43_0_0EXPECT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);

  ABI43_0_0EXPECT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI43_0_0EXPECT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ABI43_0_0EXPECT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ABI43_0_0EXPECT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypesIncomplete) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI43_0_0EXPECT_EQ(raw.at("doubleValue", nullptr, nullptr), nullptr);
  ABI43_0_0EXPECT_EQ(raw.at("floatValue", nullptr, nullptr), nullptr);
  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI43_0_0EXPECT_EQ(raw.at("stringValue", nullptr, nullptr), nullptr);
  ABI43_0_0EXPECT_EQ(raw.at("boolValue", nullptr, nullptr), nullptr);
  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
}

#ifndef NDEBUG
TEST(RawPropsTest, handleRawPropsPrimitiveTypesIncorrectLookup) {
  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser);

  // Before D18662135, looking up an invalid key would trigger
  // an infinite loop. This is out of contract, so we should only
  // test this in debug.
  ABI43_0_0EXPECT_EQ(raw.at("flurb", nullptr, nullptr), nullptr);
  ABI43_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
}
#endif

TEST(RawPropsTest, handlePropsMultiLookup) {
  const auto &raw = RawProps(folly::dynamic::object("floatValue", (float)10.0));
  auto parser = RawPropsParser();
  parser.prepare<PropsMultiLookup>();
  raw.parse(parser);

  auto props = std::make_shared<PropsMultiLookup>(PropsMultiLookup(), raw);

  // Props are not sealed after applying raw props.
  ABI43_0_0EXPECT_FALSE(props->getSealed());

  ABI43_0_0EXPECT_NEAR(props->floatValue, 10.0, 0.00001);
  ABI43_0_0EXPECT_NEAR(props->derivedFloatValue, 20.0, 0.00001);
}
