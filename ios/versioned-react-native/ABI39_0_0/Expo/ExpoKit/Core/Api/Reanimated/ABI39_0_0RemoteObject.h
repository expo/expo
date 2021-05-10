#pragma once

#include "ABI39_0_0SharedParent.h"
#include "ABI39_0_0FrozenObject.h"

using namespace ABI39_0_0facebook;

namespace ABI39_0_0reanimated {

class RemoteObject: public jsi::HostObject {
private:
  NativeReanimatedModule *module;
  std::shared_ptr<jsi::Object> backing;
  std::unique_ptr<FrozenObject> initializer;
public:
  void maybeInitializeOnUIRuntime(jsi::Runtime &rt);
  RemoteObject(jsi::Runtime &rt, jsi::Object &object, NativeReanimatedModule *module):
    module(module), initializer(new FrozenObject(rt, object, module)) {}
  void set(jsi::Runtime &rt, const jsi::PropNameID &name, const jsi::Value &value);
  jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name);
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt);
};

}
