#pragma once

#include <jsi/jsi.h>
#include <map>
#include <memory>
#include <mutex>
#include <vector>
#include "JSIStoreValueUser.h"
#include "LayoutAnimationsProxy.h"
#include "MutableValueSetterProxy.h"
#include "RuntimeManager.h"
#include "SharedParent.h"

using namespace facebook;

namespace reanimated {

class MutableValue : public jsi::HostObject,
                     public std::enable_shared_from_this<MutableValue>,
                     public StoreUser {
 private:
  friend MutableValueSetterProxy;
  RuntimeManager *runtimeManager;
  friend LayoutAnimationsProxy;
  std::mutex readWriteMutex;
  std::shared_ptr<ShareableValue> value;
  std::weak_ptr<jsi::Value> animation;
  std::map<unsigned long, std::function<void()>> listeners;

  void setValue(jsi::Runtime &rt, const jsi::Value &newValue);
  jsi::Value getValue(jsi::Runtime &rt);

 public:
  MutableValue(
      jsi::Runtime &rt,
      const jsi::Value &initial,
      RuntimeManager *runtimeManager,
      std::shared_ptr<Scheduler> s);

 public:
  void
  set(jsi::Runtime &rt, const jsi::PropNameID &name, const jsi::Value &value);
  jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name);
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt);
  unsigned long addListener(
      unsigned long listenerId,
      std::function<void()> listener);
  void removeListener(unsigned long listenerId);
};

} // namespace reanimated
