// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "ExpectedType.h"

namespace expo {
CppType ExpectedType::getCombinedTypes() {
  static const auto method = getClass()->getMethod<int()>("getCombinedTypes");
  return static_cast<CppType>(method(self()));
}
} // namespace expo
