// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "AnyType.h"
#include "FrontendConverterProvider.h"
#include "../JSIInteropModuleRegistry.h"

namespace expo {
AnyType::AnyType(
  jni::local_ref<expo::ExpectedType> expectedType
) : converter(FrontendConverterProvider::instance()->obtainConverter(std::move(expectedType))) {}
} // namespace expo
