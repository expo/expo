#pragma once

#include <jsi/jsi.h>
#include <stdio.h>
#include <functional>
#include <map>
#include <memory>

namespace reanimated {

using namespace facebook;

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
