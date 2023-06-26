/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <gtest/gtest.h>
#include <ABI49_0_0React/debug/ABI49_0_0flags.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ConcreteShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ShadowNode.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0propsConversions.h>

#include "ABI49_0_0TestComponent.h"

using namespace ABI49_0_0facebook::ABI49_0_0React;

class PropsSingleFloat : public Props {
 public:
  PropsSingleFloat() = default;
  PropsSingleFloat(
      const PropsParserContext &context,
      const PropsSingleFloat &sourceProps,
      const RawProps &rawProps)
      : floatValue(convertRawProp(
            context,
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
      const PropsParserContext &context,
      const PropsSingleDouble &sourceProps,
      const RawProps &rawProps)
      : doubleValue(convertRawProp(
            context,
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
  PropsSingleInt(
      const PropsParserContext &context,
      const PropsSingleInt &sourceProps,
      const RawProps &rawProps)
      : intValue(convertRawProp(
            context,
            rawProps,
            "intValue",
            sourceProps.intValue,
            17)) {}

 private:
  const int intValue{17};
};

class PropsPrimitiveTypes : public Props {
 public:
  PropsPrimitiveTypes() = default;
  PropsPrimitiveTypes(
      const PropsParserContext &context,
      const PropsPrimitiveTypes &sourceProps,
      const RawProps &rawProps)
      : intValue(convertRawProp(
            context,
            rawProps,
            "intValue",
            sourceProps.intValue,
            17)),
        doubleValue(convertRawProp(
            context,
            rawProps,
            "doubleValue",
            sourceProps.doubleValue,
            17.56)),
        floatValue(convertRawProp(
            context,
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            56.75)),
        stringValue(convertRawProp(
            context,
            rawProps,
            "stringValue",
            sourceProps.stringValue,
            "")),
        boolValue(convertRawProp(
            context,
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
      const PropsParserContext &context,
      const PropsMultiLookup &sourceProps,
      const RawProps &rawProps)
      : floatValue(convertRawProp(
            context,
            rawProps,
            "floatValue",
            sourceProps.floatValue,
            17.5)),
        // While this specific pattern is uncommon, it's a simplification of a
        // pattern that does occur a lot: nested structs that access props we
        // have already accessed populating Props
        derivedFloatValue(
            convertRawProp(
                context,
                rawProps,
                "floatValue",
                sourceProps.floatValue,
                40) *
            2) {}

  const float floatValue{17.5};
  const float derivedFloatValue{40};
};

TEST(RawPropsTest, handleProps) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  auto parser = RawPropsParser();
  parser.prepare<Props>();
  raw.parse(parser, parserContext);

  auto props = std::make_shared<Props>(parserContext, Props(), raw);

  // Props are not sealed after applying raw props.
  ABI49_0_0EXPECT_FALSE(props->getSealed());

  ABI49_0_0EXPECT_STREQ(props->nativeId.c_str(), "abc");
}

TEST(RawPropsTest, handleRawPropsSingleString) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw = RawProps(folly::dynamic::object("nativeID", "abc"));
  auto parser = RawPropsParser();
  parser.prepare<Props>();
  raw.parse(parser, parserContext);

  std::string value = (std::string)*raw.at("nativeID", nullptr, nullptr);

  ABI49_0_0EXPECT_STREQ(value.c_str(), "abc");
}

TEST(RawPropsTest, handleRawPropsSingleFloat) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw =
      RawProps(folly::dynamic::object("floatValue", (float)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleFloat>();
  raw.parse(parser, parserContext);

  auto value = (float)*raw.at("floatValue", nullptr, nullptr);

  ABI49_0_0EXPECT_NEAR(value, 42.42, 0.00001);
}

TEST(RawPropsTest, handleRawPropsSingleDouble) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw =
      RawProps(folly::dynamic::object("doubleValue", (double)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleDouble>();
  raw.parse(parser, parserContext);

  auto value = (double)*raw.at("doubleValue", nullptr, nullptr);

  ABI49_0_0EXPECT_NEAR(value, 42.42, 0.00001);
}

TEST(RawPropsTest, handleRawPropsSingleInt) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleInt>();
  raw.parse(parser, parserContext);

  int value = (int)*raw.at("intValue", nullptr, nullptr);

  ABI49_0_0EXPECT_EQ(value, 42);
}

TEST(RawPropsTest, handleRawPropsSingleIntGetManyTimes) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42.42));
  auto parser = RawPropsParser();
  parser.prepare<PropsSingleInt>();
  raw.parse(parser, parserContext);

  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypes) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw = RawProps(
      folly::dynamic::object("intValue", (int)42)("doubleValue", (double)17.42)(
          "floatValue",
          (float)66.67)("stringValue", "helloworld")("boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser, parserContext);

  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI49_0_0EXPECT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ABI49_0_0EXPECT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ABI49_0_0EXPECT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ABI49_0_0EXPECT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypesGetTwice) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw = RawProps(
      folly::dynamic::object("intValue", (int)42)("doubleValue", (double)17.42)(
          "floatValue",
          (float)66.67)("stringValue", "helloworld")("boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser, parserContext);

  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI49_0_0EXPECT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ABI49_0_0EXPECT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ABI49_0_0EXPECT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ABI49_0_0EXPECT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);

  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI49_0_0EXPECT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ABI49_0_0EXPECT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ABI49_0_0EXPECT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ABI49_0_0EXPECT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypesGetOutOfOrder) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw = RawProps(
      folly::dynamic::object("intValue", (int)42)("doubleValue", (double)17.42)(
          "floatValue",
          (float)66.67)("stringValue", "helloworld")("boolValue", true));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser, parserContext);

  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI49_0_0EXPECT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ABI49_0_0EXPECT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ABI49_0_0EXPECT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ABI49_0_0EXPECT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);

  ABI49_0_0EXPECT_NEAR((double)*raw.at("doubleValue", nullptr, nullptr), 17.42, 0.0001);
  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI49_0_0EXPECT_NEAR((float)*raw.at("floatValue", nullptr, nullptr), 66.67, 0.00001);
  ABI49_0_0EXPECT_STREQ(
      ((std::string)*raw.at("stringValue", nullptr, nullptr)).c_str(),
      "helloworld");
  ABI49_0_0EXPECT_EQ((bool)*raw.at("boolValue", nullptr, nullptr), true);
}

TEST(RawPropsTest, handleRawPropsPrimitiveTypesIncomplete) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser, parserContext);

  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI49_0_0EXPECT_EQ(raw.at("doubleValue", nullptr, nullptr), nullptr);
  ABI49_0_0EXPECT_EQ(raw.at("floatValue", nullptr, nullptr), nullptr);
  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
  ABI49_0_0EXPECT_EQ(raw.at("stringValue", nullptr, nullptr), nullptr);
  ABI49_0_0EXPECT_EQ(raw.at("boolValue", nullptr, nullptr), nullptr);
  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
}

#ifdef ABI49_0_0REACT_NATIVE_DEBUG
TEST(RawPropsTest, handleRawPropsPrimitiveTypesIncorrectLookup) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw = RawProps(folly::dynamic::object("intValue", (int)42));

  auto parser = RawPropsParser();
  parser.prepare<PropsPrimitiveTypes>();
  raw.parse(parser, parserContext);

  // Before D18662135, looking up an invalid key would trigger
  // an infinite loop. This is out of contract, so we should only
  // test this in debug.
  ABI49_0_0EXPECT_EQ(raw.at("flurb", nullptr, nullptr), nullptr);
  ABI49_0_0EXPECT_EQ((int)*raw.at("intValue", nullptr, nullptr), 42);
}
#endif

TEST(RawPropsTest, handlePropsMultiLookup) {
  ContextContainer contextContainer{};
  PropsParserContext parserContext{-1, contextContainer};

  const auto &raw = RawProps(folly::dynamic::object("floatValue", (float)10.0));
  auto parser = RawPropsParser();
  parser.prepare<PropsMultiLookup>();
  raw.parse(parser, parserContext);

  auto props = std::make_shared<PropsMultiLookup>(
      parserContext, PropsMultiLookup(), raw);

  // Props are not sealed after applying raw props.
  ABI49_0_0EXPECT_FALSE(props->getSealed());

  ABI49_0_0EXPECT_NEAR(props->floatValue, 10.0, 0.00001);
  ABI49_0_0EXPECT_NEAR(props->derivedFloatValue, 20.0, 0.00001);
}
