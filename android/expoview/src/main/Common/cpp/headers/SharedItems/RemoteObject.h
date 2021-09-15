#pragma once

#include "SharedParent.h"
#include "FrozenObject.h"
#include "JSIStoreValueUser.h"

using namespace facebook;

namespace reanimated {

class RemoteObject: public jsi::HostObject, public StoreUser {
private:
  std::weak_ptr<jsi::Value> backing;
  std::unique_ptr<FrozenObject> initializer;
public:
  void maybeInitializeOnWorkletRuntime(jsi::Runtime &rt);
  RemoteObject(jsi::Runtime &rt, jsi::Object &object, RuntimeManager *runtimeManager, std::shared_ptr<Scheduler> s):
     StoreUser(s), initializer(std::make_unique<FrozenObject>(rt, object, runtimeManager)) {}
  void set(jsi::Runtime &rt, const jsi::PropNameID &name, const jsi::Value &value);
  jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name);
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt);
};

}
