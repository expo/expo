#include "LayoutAnimationsProxy.h"
#include "FrozenObject.h"
#include "MutableValue.h"
#include "ShareableValue.h"
#include "ValueWrapper.h"

namespace reanimated {

const long long idOffset = 1e9;

LayoutAnimationsProxy::LayoutAnimationsProxy(
    std::function<void(int, jsi::Object newProps)> _notifyAboutProgress,
    std::function<void(int, bool)> _notifyAboutEnd)
    : notifyAboutProgress(std::move(_notifyAboutProgress)),
      notifyAboutEnd(std::move(_notifyAboutEnd)) {}

void LayoutAnimationsProxy::startObserving(
    int tag,
    std::shared_ptr<MutableValue> sv,
    jsi::Runtime &rt) {
  observedValues[tag] = sv;
  sv->addListener(tag + idOffset, [sv, tag, this, &rt]() {
    std::shared_ptr<FrozenObject> newValue =
        ValueWrapper::asFrozenObject(sv->value->valueContainer);
    this->notifyAboutProgress(tag, newValue->shallowClone(rt));
  });
}

void LayoutAnimationsProxy::stopObserving(int tag, bool finished) {
  if (observedValues.count(tag) == 0) {
    return;
  }
  std::shared_ptr<MutableValue> sv = observedValues[tag];
  sv->removeListener(tag + idOffset);
  observedValues.erase(tag);
  this->notifyAboutEnd(tag, !finished);
}

void LayoutAnimationsProxy::notifyAboutCancellation(int tag) {
  this->notifyAboutEnd(tag, false);
}

} // namespace reanimated
