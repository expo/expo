#pragma once

#include "ABI40_0_0SharedParent.h"
#include "ABI40_0_0FrozenObject.h"
#include "ABI40_0_0JSIStoreValueUser.h"

using namespace ABI40_0_0facebook;

namespace ABI40_0_0reanimated {

class RemoteObject: public jsi::HostObject, public StoreUser {
private:
  NativeReanimatedModule *module;
  std::weak_ptr<jsi::Value> backing;
  std::unique_ptr<FrozenObject> initializer;
public:
  void maybeInitializeOnUIRuntime(jsi::Runtime &rt);
  RemoteObject(jsi::Runtime &rt, jsi::Object &object, NativeReanimatedModule *module, std::shared_ptr<Scheduler> s):
     StoreUser(s), module(module), initializer(new FrozenObject(rt, object, module)) {}
  void set(jsi::Runtime &rt, const jsi::PropNameID &name, const jsi::Value &value);
  jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name);
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt);
};

}
