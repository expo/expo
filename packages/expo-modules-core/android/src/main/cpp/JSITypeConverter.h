// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JSIObjectWrapper.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <type_traits>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {
/**
 * A base template of the jni to jsi types converter.
 * To make this conversion as fast and easy as possible we used the type trait technic.
 */
template<class T, typename = void>
struct jsi_type_converter {
  static const bool isDefined = false;
};

/**
 * Conversion from jni::alias_ref<T::javaobject> to jsi::Value where T extends JSIValueWrapper or JSIObjectWrapper.
 */
template<class T>
struct jsi_type_converter<
  jni::alias_ref<T>,
  std::enable_if_t<
    // jni::ReprType<T>::HybridType>::value if T looks like `R::javaobject`, it will return R
    std::is_base_of<JSIValueWrapper, typename jni::ReprType<T>::HybridType>::value ||
    std::is_base_of<JSIObjectWrapper, typename jni::ReprType<T>::HybridType>::value
  >
> {
  static const bool isDefined = true;

  inline static jsi::Value convert(
    jsi::Runtime &runtime,
    jni::alias_ref<T> &value) {
    if (value == nullptr) {
      return jsi::Value::undefined();
    }
    return jsi::Value(runtime, *value->cthis()->get());
  }
};

/**
 * Conversion from primitive types from which jsi::Value can be constructed (like bool, double) to jsi::Value.
 */
template<class T>
struct jsi_type_converter<
  T,
  std::enable_if_t<std::is_fundamental_v<T> && std::is_constructible_v<jsi::Value, T>>
> {
  static const bool isDefined = true;

  inline static jsi::Value convert(jsi::Runtime &runtime, T value) {
    return jsi::Value(value);
  }
};

/**
 * Conversion from jni::alias_ref<jstring> to jsi::Value.
 */
template<>
struct jsi_type_converter<jni::alias_ref<jstring>> {
  static const bool isDefined = true;

  inline static jsi::Value convert(jsi::Runtime &runtime, jni::alias_ref<jstring> &value) {
    if (value == nullptr) {
      return jsi::Value::undefined();
    }
    return jsi::Value(jsi::String::createFromUtf8(runtime, value->toStdString()));
  }
};

/**
 * Helper that checks if the type converter was defined for the given type.
 */
template<class T>
inline constexpr bool is_jsi_type_converter_defined = jsi_type_converter<T>::isDefined;
} // namespace expo
