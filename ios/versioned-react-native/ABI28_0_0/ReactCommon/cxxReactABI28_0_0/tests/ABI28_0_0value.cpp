// Copyright 2004-present Facebook. All Rights Reserved.
#include <string>
#include <gtest/gtest.h>
#include <folly/json.h>
#include <ABI28_0_0jschelpers/ABI28_0_0Value.h>

#ifdef WITH_FBJSCEXTENSION
#undef ASSERT
#include <JavaScriptCore/config.h>
#include "ABI28_0_0OpaqueJSString.h"
#endif

#include <stdexcept>

using namespace facebook::ReactABI28_0_0;

#ifdef ANDROID
#include <android/looper.h>
static void prepare() {
  ALooper_prepare(0);
}
#else
static void prepare() {}
#endif

TEST(Value, Undefined) {
  prepare();
  JSGlobalContextRef ctx = JSC_JSGlobalContextCreateInGroup(false, nullptr, nullptr);
  auto v = Value::makeUndefined(ctx);
  auto s = String::adopt(ctx, JSC_JSValueToStringCopy(ctx, v, nullptr));
  ABI28_0_0EXPECT_EQ("undefined", s.str());
  JSC_JSGlobalContextRelease(ctx);
}

TEST(Value, FromJSON) {
  prepare();
  JSGlobalContextRef ctx = JSC_JSGlobalContextCreateInGroup(false, nullptr, nullptr);
  String s(ctx, "{\"a\": 4}");
  Value v(Value::fromJSON(s));
  ABI28_0_0EXPECT_TRUE(v.isObject());
  JSC_JSGlobalContextRelease(ctx);
}

TEST(Value, ToJSONString) {
  prepare();
  JSGlobalContextRef ctx = JSC_JSGlobalContextCreateInGroup(false, nullptr, nullptr);
  String s(ctx, "{\"a\": 4}");
  Value v(Value::fromJSON(s));
  folly::dynamic dyn = folly::parseJson(v.toJSONString());
  ASSERT_NE(nullptr, dyn);
  ABI28_0_0EXPECT_TRUE(dyn.isObject());
  auto val = dyn.at("a");
  ASSERT_NE(nullptr, val);
  ASSERT_TRUE(val.isNumber());
  ABI28_0_0EXPECT_EQ(4, val.asInt());
  ABI28_0_0EXPECT_EQ(4.0f, val.asDouble());

  JSC_JSGlobalContextRelease(ctx);
}

#ifdef WITH_FBJSCEXTENSION
// Just test that handling invalid data doesn't crash.
TEST(Value, FromBadUtf8) {
  prepare();
  JSGlobalContextRef ctx = JSC_JSGlobalContextCreateInGroup(false, nullptr, nullptr);
  // 110xxxxx 10xxxxxx
  auto dyn = folly::dynamic("\xC0");
  Value::fromDynamic(ctx, dyn);
  dyn = folly::dynamic("\xC0\x00");
  Value::fromDynamic(ctx, dyn);
  // 1110xxxx 10xxxxxx  10xxxxxx
  dyn = "\xE0";
  Value::fromDynamic(ctx, dyn);
  Value(ctx, Value::fromDynamic(ctx, dyn)).toJSONString();
  dyn = "\xE0\x00";
  Value::fromDynamic(ctx, dyn);
  Value(ctx, Value::fromDynamic(ctx, dyn)).toJSONString();
  dyn = "\xE0\x00\x00";
  Value::fromDynamic(ctx, dyn);
  Value(ctx, Value::fromDynamic(ctx, dyn)).toJSONString();
  dyn = "\xE0\xA0\x00";
  Value::fromDynamic(ctx, dyn);
  // 11110xxx 10xxxxxx  10xxxxxx  10xxxxxx
  dyn = "\xF0";
  Value::fromDynamic(ctx, dyn);
  Value(ctx, Value::fromDynamic(ctx, dyn)).toJSONString();
  dyn = "\xF0\x00\x00\x00";
  Value::fromDynamic(ctx, dyn);
  dyn = "\xF0\x80\x80\x00";
  Value::fromDynamic(ctx, dyn);
  Value(ctx, Value::fromDynamic(ctx, dyn)).toJSONString();
  JSC_JSGlobalContextRelease(ctx);
}

// Just test that handling invalid data doesn't crash.
TEST(Value, BadUtf16) {
  prepare();
  JSGlobalContextRef ctx = JSC_JSGlobalContextCreateInGroup(false, nullptr, nullptr);
  UChar buf[] = { 0xDD00, 0xDD00, 0xDD00, 0x1111 };
  JSStringRef ref = OpaqueJSString::create(buf, 4).leakRef();
  Value v(ctx, ref);
  v.toJSONString(0);
  JSC_JSGlobalContextRelease(ctx);
}
#endif
