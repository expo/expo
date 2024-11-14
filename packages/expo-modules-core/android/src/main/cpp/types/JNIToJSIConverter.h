// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "../JSIContext.h"
#include "../JSharedObject.h"
#include "../JNIUtils.h"
#include "ObjectDeallocator.h"
#include "../javaclasses/Collections.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <optional>

#include <react/jni/ReadableNativeMap.h>
#include <react/jni/ReadableNativeArray.h>
#include <react/jni/WritableNativeArray.h>
#include <react/jni/WritableNativeMap.h>
#include <jsi/JSIDynamic.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

jsi::Value convert(
  JNIEnv *env,
  jsi::Runtime &rt,
  const jni::local_ref<jobject> &value
);

/**
 * Convert a string with FollyDynamicExtensionConverter support.
 */
std::optional<jsi::Value>
convertStringToFollyDynamicIfNeeded(jsi::Runtime &rt, const std::string &string);

/**
 * Decorate jsi::Value with FollyDynamicExtensionConverter support.
 */
std::optional<jsi::Value>
decorateValueForDynamicExtension(jsi::Runtime &rt, const jsi::Value &value);

template<typename T, typename = void>
struct has_cthis : std::false_type {
};

template<typename T>
struct has_cthis<T, std::void_t<decltype(std::declval<T &>()->cthis())>> : std::true_type {
};

template<typename T, typename = void>
struct has_toStdString : std::false_type {
};

template<typename T>
struct has_toStdString<T, std::void_t<decltype(std::declval<T &>()->toStdString())>>
  : std::true_type {
};

template<typename T, typename = void>
struct has_value : std::false_type {
};

template<typename T>
struct has_value<T, std::void_t<decltype(std::declval<T &>()->value())>>
  : std::true_type {
};

template<typename T, typename = void>
struct has_get_region : std::false_type {
};

template<typename T>
struct has_get_region<T, std::void_t<decltype(std::declval<T &>()->getRegion(std::declval<jsize>(),
                                                                             std::declval<jsize>()))>>
  : std::true_type {
};

template<typename T>
struct RawArray {
  typedef T element_type;

  std::shared_ptr<T[]> data;
  size_t size;
};

template<typename T>
struct deref {
  typedef T type;
};

template<typename T>
struct deref<jni::local_ref<T>> {
  typedef T type;
};

template<typename T>
struct deref<jni::local_ref<T>&> {
  typedef T type;
};

template<typename T>
struct deref<jni::global_ref<T>> {
  typedef T type;
};

template<typename T>
struct deref<jni::global_ref<T>&> {
  typedef T type;
};

template<typename T>
struct deref<jni::alias_ref<T>> {
  typedef T type;
};

template<typename T>
struct deref<jni::alias_ref<T>&> {
  typedef T type;
};

template<typename T>
inline auto unwrapJNIRef(
  T &&value
) {
  if constexpr (has_cthis<T>::value) {
    return value->cthis();
  } else if constexpr (has_toStdString<T>::value) {
    return value->toStdString();
  } else if constexpr (std::is_same<typename deref<T>::type, jni::JBoolean>::value) {
    return (bool) value->value();
  } else if constexpr (has_value<T>::value) {
    return value->value();
  } else if constexpr (has_get_region<T>::value) {
    size_t size = value->size();
    auto region = value->getRegion(0, size);
    RawArray<typename decltype(region)::element_type> rawArray;
    rawArray.size = size;
    rawArray.data = std::move(region);
    return rawArray;
  } else {
    return value;
  }
}

template<class T>
using is_trivially_convertible = std::enable_if_t<std::is_constructible_v<jsi::Value, T>>;

template<typename T, typename Enable = void>
class JNIToJSIConverter;

struct SimpleConverter;
struct RefConverter;

template<typename T>
class JNIToJSIConverter<T, is_trivially_convertible<T>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    T value
  ) {
    return {value};
  }
};

template<typename T>
using is_convertible_using_runtime = std::enable_if_t<
  std::is_constructible_v<jsi::Value, jsi::Runtime &, T> &&
  !std::is_constructible_v<jsi::Value, T>
>;

template<typename T>
class JNIToJSIConverter<T, is_convertible_using_runtime<T>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    T value
  ) {
    return {rt, value};
  }
};

template<typename T>
class JNIToJSIConverter<T, std::enable_if_t<std::is_same_v<T, std::nullptr_t>>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    T value
  ) {
    return jsi::Value::null();
  }
};

template<>
class JNIToJSIConverter<long> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    long value
  ) {
    return {static_cast<double>(value)};
  }
};

template<>
class JNIToJSIConverter<long long> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    long long value
  ) {
    return {static_cast<double>(value)};
  }
};

template<>
class JNIToJSIConverter<JavaScriptModuleObject *> {
public:
  typedef RefConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    JavaScriptModuleObject *value,
    const jni::local_ref<JavaScriptModuleObject::javaobject> &ref
  ) {
    auto jsiObject = value->getJSIObject(rt);

    jni::global_ref<jobject> globalRef = jni::make_global(ref);

    common::setDeallocator(
      rt,
      jsiObject,
      [globalRef = std::move(globalRef)]() mutable {
        globalRef.reset();
      }
    );

    return {rt, *jsiObject};
  }
};

template<>
class JNIToJSIConverter<jni::local_ref<JSharedObject::javaobject>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jni::local_ref<JSharedObject::javaobject> &value
  ) {
    JSIContext *jsiContext = getJSIContext(rt);
    return convertSharedObject(value, rt, jsiContext);
  }
};

template<>
class JNIToJSIConverter<jni::global_ref<JSharedObject::javaobject>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jni::global_ref<JSharedObject::javaobject> &value
  ) {
    JSIContext *jsiContext = getJSIContext(rt);
    return convertSharedObject(jni::make_local(value), rt, jsiContext);
  }
};

template<>
class JNIToJSIConverter<jni::alias_ref<JSharedObject::javaobject>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jni::alias_ref<JSharedObject::javaobject> &value
  ) {
    JSIContext *jsiContext = getJSIContext(rt);
    return convertSharedObject(jni::make_local(value), rt, jsiContext);
  }
};

template<>
class JNIToJSIConverter<JavaScriptTypedArray *> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    JavaScriptTypedArray *value
  ) {
    auto jsTypedArray = value->get();
    return {rt, *jsTypedArray};
  }
};

template<>
class JNIToJSIConverter<react::WritableNativeArray *> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    react::WritableNativeArray *value
  ) {
    auto dynamic = value->consume();
    auto arg = jsi::valueFromDynamic(rt, dynamic);
    auto enhancedArg = decorateValueForDynamicExtension(rt, arg);
    if (enhancedArg) {
      arg = std::move(*enhancedArg);
    }
    return arg;
  }
};

template<>
class JNIToJSIConverter<react::WritableNativeMap *> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    react::WritableNativeMap *value
  ) {
    auto dynamic = value->consume();
    auto arg = jsi::valueFromDynamic(rt, dynamic);
    auto enhancedArg = decorateValueForDynamicExtension(rt, arg);
    if (enhancedArg) {
      arg = std::move(*enhancedArg);
    }
    return arg;
  }
};

template<>
class JNIToJSIConverter<std::string> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    const std::string &value
  ) {
    auto enhancedValue = convertStringToFollyDynamicIfNeeded(rt, value);
    return enhancedValue ? std::move(*enhancedValue) : jsi::String::createFromUtf8(rt, value);
  }
};

template<>
class JNIToJSIConverter<folly::dynamic> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    const folly::dynamic &value
  ) {
    auto arg = jsi::valueFromDynamic(rt, value);
    auto enhancedArg = decorateValueForDynamicExtension(rt, arg);
    if (enhancedArg) {
      arg = std::move(*enhancedArg);
    }
    return arg;
  }
};

template<typename T>
class JNIToJSIConverter<RawArray<T>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    const RawArray<T> &value
  ) {
    auto jsArray = jsi::Array(rt, value.size);
    for (size_t i = 0; i < value.size; i++) {
      jsArray.setValueAtIndex(rt, i, JNIToJSIConverter<T>::convert(env, rt, value.data[i]));
    }
    return jsArray;
  }
};

template<>
class JNIToJSIConverter<jni::global_ref<jni::JCollection<jobject>>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jni::global_ref<jni::JCollection<jobject>> &list
  ) {
    size_t size = list->size();
    auto jsArray = jsi::Array(rt, size);
    size_t index = 0;

    for (const auto &item: *list) {
      jsArray.setValueAtIndex(
        rt,
        index++,
        ::expo::convert(env, rt, item)
      );
    }
    return jsArray;
  }
};

template<>
class JNIToJSIConverter<jni::local_ref<jni::JCollection<jobject>>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jni::local_ref<jni::JCollection<jobject>> &list
  ) {
    size_t size = list->size();
    auto jsArray = jsi::Array(rt, size);
    size_t index = 0;

    for (const auto &item: *list) {
      jsArray.setValueAtIndex(
        rt,
        index++,
        ::expo::convert(env, rt, item)
      );
    }
    return jsArray;
  }
};

template<>
class JNIToJSIConverter<jni::global_ref<jni::JMap<jstring, jobject>>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jni::global_ref<jni::JMap<jstring, jobject>> &map
  ) {
    jsi::Object jsObject(rt);

    for (const auto &entry: *map) {
      auto key = entry.first->toStdString();
      auto value = entry.second;
      jsObject.setProperty(
        rt,
        key.c_str(),
        ::expo::convert(env, rt, value)
      );
    }

    return jsObject;
  }
};

template<>
class JNIToJSIConverter<jni::local_ref<jni::JMap<jstring, jobject>>> {
public:
  typedef SimpleConverter converterType;

  static inline jsi::Value convert(
    JNIEnv *env,
    jsi::Runtime &rt,
    const jni::local_ref<jni::JMap<jstring, jobject>> &map
  ) {
    jsi::Object jsObject(rt);

    for (const auto &entry: *map) {
      auto key = entry.first->toStdString();
      auto value = entry.second;
      jsObject.setProperty(
        rt,
        key.c_str(),
        ::expo::convert(env, rt, value)
      );
    }

    return jsObject;
  }
};

template<typename T>
inline jsi::Value convertToJS(JNIEnv *env, jsi::Runtime &rt, T &&value) {
  if constexpr (std::is_same_v<SimpleConverter, typename JNIToJSIConverter<
    decltype(unwrapJNIRef(std::declval<T>()))
  >::converterType>) {
    return JNIToJSIConverter<
      decltype(unwrapJNIRef(std::declval<T>()))
    >::convert(env, rt, unwrapJNIRef(std::forward<T>(value)));
  } else {
    return JNIToJSIConverter<
      decltype(unwrapJNIRef(std::declval<T>()))
    >::convert(env, rt, unwrapJNIRef(value), value);
  }
}
} // namespace expo
