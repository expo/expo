// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "CppType.h"

#include <jsi/jsi.h>
#include <fbjni/fbjni.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {
class JSIContext;
class SingleType;

/**
 * A base interface for all frontend converter classes - converters that cast jsi values into JNI objects.
 * Right now, we have two-step arguments conversion. Firstly, we unwrapped the JSI value into selected JNI objects (see CppType).
 * Then, we do a more sophisticated conversion like creating records or mapping into enums.
 * The second step lives in the Kotlin codebase.
 */
class FrontendConverter {
public:
  virtual ~FrontendConverter() = default;

  /**
   * Checks if the provided value can be converted.
   */
  virtual bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const = 0;

  /**
   * Converts the provided value.
   */
  virtual jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const = 0;
};

/**
 * Converter from js number to [java.lang.Integer].
 */
class IntegerFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js number to [java.lang.Long].
 */
class LongFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js number to [java.lang.Float].
 */
class FloatFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js bool to [java.lang.Boolean].
 */
class BooleanFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js number to [java.lang.Double].
 */
class DoubleFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js string to [java.lang.String].
 */
class StringFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js array to [com.facebook.react.bridge.ReadableNativeArray].
 */
class ReadableNativeArrayFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js object to [com.facebook.react.bridge.ReadableNativeMap].
 */
class ReadableNativeMapArrayFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js Uint8Array to [java.lang.Byte] array.
 */
class ByteArrayFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js type array to [expo.modules.kotlin.jni.JavaScriptTypedArray].
 */
class TypedArrayFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from any js value to [expo.modules.kotlin.jni.JavaScriptValue].
 */
class JavaScriptValueFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js object to [expo.modules.kotlin.jni.JavaScriptObject].
 */
class JavaScriptObjectFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js function to [expo.modules.kotlin.jni.JavaScriptFunction].
 */
class JavaScriptFunctionFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js view object to int.
 */
class ViewTagFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter from js shared object to int.
 */
class SharedObjectIdConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Converter that always fails.
 * Used to not fail when the function is created.
 * TODO(@lukmccall): remove
 */
class UnknownFrontendConverter : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
};

/**
 * Same types like enums can be represented by multiply js types.
 * That's why we have a converter that can combine multiple converters into one.
 *
 * For instance, enum classes will be represented as a PolyFrontendConverter({StringFrontendConverter, IntegerFrontendConverter})
 */
class PolyFrontendConverter : public FrontendConverter {
public:
  PolyFrontendConverter(std::vector<std::shared_ptr<FrontendConverter>> converters);

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;

  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

private:
  std::vector<std::shared_ptr<FrontendConverter>> converters;
};

/**
 * Converter from js array object to Java primitive array.
 */
class PrimitiveArrayFrontendConverter : public FrontendConverter {
public:
  PrimitiveArrayFrontendConverter(
    jni::local_ref<jni::JavaClass<SingleType>::javaobject> expectedType
  );

  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;

private:
  /**
   * A string representation of desired Java type.
   */
  std::string javaType;
  /**
   * Bare parameter type.
   */
  CppType parameterType;
  /**
   * Converter used to convert array elements.
   */
  std::shared_ptr<FrontendConverter> parameterConverter;
};

/**
 * Converter from js array object to [java.utils.ArrayList].
 */
class ListFrontendConverter : public FrontendConverter {
public:
  ListFrontendConverter(
    jni::local_ref<jni::JavaClass<SingleType>::javaobject> expectedType
  );

  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
private:
  /**
   * Converter used to convert array elements.
   */
  std::shared_ptr<FrontendConverter> parameterConverter;

  jobject convertSingleValue(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const;
};

/**
 * Converter from js object to [java.utils.LinkedHashMap].
 */
class MapFrontendConverter : public FrontendConverter {
public:
  MapFrontendConverter(
    jni::local_ref<jni::JavaClass<SingleType>::javaobject> expectedType
  );

  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;
private:
  /**
   * Converter used to convert values.
   */
  std::shared_ptr<FrontendConverter> valueConverter;
};

/**
 * Converter from js object to [kotlin.Any] (Boolean, Double, String, Map<Any>, List<Any>).
 */
class AnyFrontendConvert : public FrontendConverter {
public:
  jobject convert(
    jsi::Runtime &rt,
    JNIEnv *env,
    const jsi::Value &value
  ) const override;

  bool canConvert(jsi::Runtime &rt, const jsi::Value &value) const override;

private:
  BooleanFrontendConverter booleanConverter;
  DoubleFrontendConverter doubleConverter;
  StringFrontendConverter stringConverter;
};
} // namespace expo
