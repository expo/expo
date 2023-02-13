#pragma once

#include <ABI48_0_0jsi/ABI48_0_0jsi.h>
#include <stdio.h>
#include <functional>
#include <map>
#include <memory>

namespace ABI48_0_0reanimated {

using namespace ABI48_0_0facebook;

class MutableValue;

class LayoutAnimationsProxy {
 public:
  LayoutAnimationsProxy(
      std::function<void(int, jsi::Object newProps)> _notifyAboutProgress,
      std::function<void(int, bool)> _notifyAboutEnd);

  void
  startObserving(int tag, std::shared_ptr<MutableValue> sv, jsi::Runtime &rt);
  void stopObserving(int tag, bool finished);
  void notifyAboutCancellation(int tag);

 private:
  std::function<void(int, jsi::Object newProps)> notifyAboutProgress;
  std::function<void(int, bool)> notifyAboutEnd;
  std::map<int, std::shared_ptr<MutableValue>> observedValues;
};

} // namespace reanimated
