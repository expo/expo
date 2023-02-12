#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <utility>
#include "DevMenuSharedParent.h"

using namespace facebook;

namespace devmenureanimated {

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

} // namespace devmenureanimated
