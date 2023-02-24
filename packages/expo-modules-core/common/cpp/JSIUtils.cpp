// Copyright 2022-present 650 Industries. All rights reserved.

#include "JSIUtils.h"

namespace expo {

std::vector<jsi::PropNameID> jsiArrayToPropNameIdsVector(jsi::Runtime &runtime, const jsi::Array &array) {
  size_t size = array.size(runtime);
  std::vector<jsi::PropNameID> vector;

  vector.reserve(size);

  for (size_t i = 0; i < size; i++) {
    jsi::String name = array.getValueAtIndex(runtime, i).getString(runtime);
    vector.push_back(jsi::PropNameID::forString(runtime, name));
  }
  return vector;
}

} // namespace expo
