#pragma once

#include "SharedParent.h"
#include "FrozenObject.h"

namespace reanimated {

using namespace facebook;

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
