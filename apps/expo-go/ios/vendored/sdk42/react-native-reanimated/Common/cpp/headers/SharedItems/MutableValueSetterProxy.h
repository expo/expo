#pragma once

#include "SharedParent.h"
#include <ABI42_0_0jsi/ABI42_0_0jsi.h>

using namespace ABI42_0_0facebook;

namespace ABI42_0_0reanimated {

class MutableValueSetterProxy: public jsi::HostObject {
private:
  friend MutableValue;
  std::shared_ptr<MutableValue> mutableValue;
public:
  MutableValueSetterProxy(std::shared_ptr<MutableValue> mutableValue): mutableValue(std::move(mutableValue)) {}
  void set(jsi::Runtime &rt, const jsi::PropNameID &name, const jsi::Value &value);
  jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name);
};

}
