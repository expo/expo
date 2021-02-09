#pragma once

#include "SharedParent.h"
#include <jsi/jsi.h>

using namespace facebook;

namespace reanimated {

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
