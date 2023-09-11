#pragma once

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>
#include <memory>
#include <utility>
#include "SharedParent.h"

using namespace ABI47_0_0facebook;

namespace ABI47_0_0reanimated {

class MutableValueSetterProxy : public jsi::HostObject {
 private:
  friend MutableValue;
  std::shared_ptr<MutableValue> mutableValue;

 public:
  explicit MutableValueSetterProxy(std::shared_ptr<MutableValue> mutableValue)
      : mutableValue(std::move(mutableValue)) {}
  void
  set(jsi::Runtime &rt, const jsi::PropNameID &name, const jsi::Value &value);
  jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name);
};

} // namespace reanimated
