// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "CppType.h"
#include "FrontendConverter.h"
#include "ExpectedType.h"

#include <fbjni/fbjni.h>

#include <memory>
#include <unordered_map>

namespace jni = facebook::jni;

namespace expo {
/**
 * Singleton registry used to store all basic converters.
 */
class FrontendConverterProvider {
public:
  /**
   * Gets a singleton instance.
   */
  static std::shared_ptr<FrontendConverterProvider> instance();

  /**
   * Creates converters.
   */
  void createConverters();

  /**
   * Obtains a converter for an expected type.
   */
  std::shared_ptr<FrontendConverter> obtainConverter(
    jni::local_ref<jni::JavaClass<ExpectedType>::javaobject> expectedType
  );
private:
  FrontendConverterProvider() = default;

  std::shared_ptr<FrontendConverter> obtainConverterForSingleType(
    jni::local_ref<jni::JavaClass<SingleType>::javaobject> expectedType
  );

  std::unordered_map<CppType, std::shared_ptr<FrontendConverter>> simpleConverters;
};
} // namespace expo
