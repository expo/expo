// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "../JSIContext.h"
#include "../JSharedObject.h"
#include "../JNIUtils.h"
#include "ObjectDeallocator.h"
#include "../javaclasses/Collections.h"
#include "../JavaScriptArrayBuffer.h"
#include "../NativeArrayBuffer.h"
#include "../concepts/jni_deref.h"
#include "../concepts/jni.h"
#include "../concepts/jsi.h"
#include "ReturnType.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <optional>
#include <concepts>

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

jsi::Value convert(
  JNIEnv *env,
  jsi::Runtime &rt,
  ReturnType returnType,
  const jni::local_ref<jobject> &value
);

std::optional<jsi::Value> convertStringToFollyDynamicIfNeeded(
  jsi::Runtime &rt,
  const std::string &string
);

std::optional<jsi::Value> decorateValueForDynamicExtension(
  jsi::Runtime &rt,
  const jsi::Value &value
);

template<typename T>
struct RawArray {
  using element_type = T;

  std::shared_ptr<T[]> data;
  size_t size;
};

template<typename T>
inline auto unwrapJNIRef(T &&value) {
  if constexpr (HasCthis<T>) {
    return value->cthis();
  } else if constexpr (HasToStdString<T>) {
    return value->toStdString();
  } else if constexpr (IsJBoolean<T>) {
    return static_cast<bool>(value->value());
  } else if constexpr (HasValue<T>) {
    return value->value();
  } else if constexpr (HasGetRegion<T>) {
    size_t size = value->size();
    auto region = value->getRegion(0, size);
    return RawArray<typename decltype(region)::element_type>{
      .data = std::move(region),
      .size = size
    };
  } else {
    return value;
  }
}

template<typename T, typename Enable = void>
struct JNIToJSIConverter;

template<TriviallyConvertibleToJSI T>
struct JNIToJSIConverter<T> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &, T value) {
    return jsi::Value{value};
  }
};

template<ConvertibleToJSI T>
struct JNIToJSIConverter<T> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &rt, T value) {
    return jsi::Value{rt, value};
  }
};

template<>
struct JNIToJSIConverter<std::nullptr_t> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &, std::nullptr_t) {
    return jsi::Value::null();
  }
};

template<>
struct JNIToJSIConverter<long> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &, long value) {
    return jsi::Value{static_cast<double>(value)};
  }
};

template<>
struct JNIToJSIConverter<long long> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &, long long value) {
    return jsi::Value{static_cast<double>(value)};
  }
};

template<>
struct JNIToJSIConverter<JavaScriptModuleObject *> {
  static jsi::Value convert(
    JNIEnv *,
    jsi::Runtime &rt,
    JavaScriptModuleObject *value,
    const jni::local_ref<JavaScriptModuleObject::javaobject> &ref
  ) {
    auto jsiObject = value->getJSIObject(rt);
    auto globalRef = jni::make_global(ref);

    common::setDeallocator(
      rt,
      jsiObject,
      [globalRef = std::move(globalRef)]() mutable {
        globalRef.reset();
      }
    );

    return jsi::Value{rt, *jsiObject};
  }
};

template<typename T>
concept SharedObjectRef = JniRefTo<T, JSharedObject::javaobject>;

template<SharedObjectRef T>
struct JNIToJSIConverter<T> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &rt, const T &value) {
    JSIContext *jsiContext = getJSIContext(rt);
    if constexpr (std::is_same_v<T, jni::local_ref<JSharedObject::javaobject>>) {
      return convertSharedObject(value, rt, jsiContext);
    } else {
      return convertSharedObject(jni::make_local(value), rt, jsiContext);
    }
  }
};

template<>
struct JNIToJSIConverter<JavaScriptTypedArray *> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &rt, JavaScriptTypedArray *value) {
    return jsi::Value{rt, *value->get()};
  }
};

template<>
struct JNIToJSIConverter<JavaScriptArrayBuffer *> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &rt, JavaScriptArrayBuffer *value) {
    return jsi::Value{rt, *value->jsiArrayBuffer()};
  }
};

template<>
struct JNIToJSIConverter<NativeArrayBuffer *> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &rt, NativeArrayBuffer *value) {
    jsi::ArrayBuffer arrayBuffer(rt, value->jsiMutableBuffer());
    return jsi::Value{rt, arrayBuffer};
  }
};

template<>
struct JNIToJSIConverter<react::WritableNativeArray *> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &rt, react::WritableNativeArray *value) {
    auto dynamic = value->consume();
    auto result = jsi::valueFromDynamic(rt, dynamic);
    if (auto enhanced = decorateValueForDynamicExtension(rt, result)) {
      return std::move(*enhanced);
    }
    return result;
  }
};

template<>
struct JNIToJSIConverter<react::WritableNativeMap *> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &rt, react::WritableNativeMap *value) {
    auto dynamic = value->consume();
    auto result = jsi::valueFromDynamic(rt, dynamic);
    if (auto enhanced = decorateValueForDynamicExtension(rt, result)) {
      return std::move(*enhanced);
    }
    return result;
  }
};

template<>
struct JNIToJSIConverter<std::string> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &rt, const std::string &value) {
    if (auto enhanced = convertStringToFollyDynamicIfNeeded(rt, value)) {
      return std::move(*enhanced);
    }
    return jsi::String::createFromUtf8(rt, value);
  }
};

template<>
struct JNIToJSIConverter<folly::dynamic> {
  static jsi::Value convert(JNIEnv *, jsi::Runtime &rt, const folly::dynamic &value) {
    auto result = jsi::valueFromDynamic(rt, value);
    if (auto enhanced = decorateValueForDynamicExtension(rt, result)) {
      return std::move(*enhanced);
    }
    return result;
  }
};

template<typename T>
struct JNIToJSIConverter<RawArray<T>> {
  static jsi::Value convert(JNIEnv *env, jsi::Runtime &rt, const RawArray<T> &value) {
    auto jsArray = jsi::Array(rt, value.size);
    for (size_t i = 0; i < value.size; i++) {
      jsArray.setValueAtIndex(rt, i, JNIToJSIConverter<T>::convert(env, rt, value.data[i]));
    }
    return jsArray;
  }
};

template<JCollectionRef<jobject> T>
struct JNIToJSIConverter<T> {
  static jsi::Value convert(JNIEnv *env, jsi::Runtime &rt, const T &list) {
    size_t size = list->size();
    auto jsArray = jsi::Array(rt, size);
    size_t index = 0;

    for (const auto &item: *list) {
      jsArray.setValueAtIndex(rt, index++, ::expo::convert(env, rt, item));
    }
    return jsArray;
  }
};

template<JMapRef<jstring, jobject> T>
struct JNIToJSIConverter<T> {
  static jsi::Value convert(JNIEnv *env, jsi::Runtime &rt, const T &map) {
    jsi::Object jsObject(rt);

    for (const auto &entry: *map) {
      jsObject.setProperty(
        rt,
        entry.first->toStdString().c_str(),
        ::expo::convert(env, rt, entry.second)
      );
    }
    return jsObject;
  }
};

template<typename RefType>
std::vector<jsi::Value> convertArray(JNIEnv *env, jsi::Runtime &rt, RefType &values) {
  size_t size = values->size();
  std::vector<jsi::Value> result;
  result.reserve(size);

  for (size_t i = 0; i < size; i++) {
    result.push_back(convert(env, rt, values->getElement(i)));
  }
  return result;
}

template<typename Converter, typename T>
concept SimpleConversion = requires(JNIEnv *env, jsi::Runtime &rt, T value) {
  { Converter::convert(env, rt, value) } -> std::same_as<jsi::Value>;
};

template<typename T>
jsi::Value convertToJS(JNIEnv *env, jsi::Runtime &rt, T &&value) {
  using UnwrappedType = decltype(unwrapJNIRef(std::declval<T>()));
  using Converter = JNIToJSIConverter<UnwrappedType>;

  if constexpr (SimpleConversion<Converter, UnwrappedType>) {
    return Converter::convert(env, rt, unwrapJNIRef(std::forward<T>(value)));
  } else {
    return Converter::convert(env, rt, unwrapJNIRef(value), value);
  }
}

} // namespace expo
