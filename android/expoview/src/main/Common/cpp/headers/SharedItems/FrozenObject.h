#pragma once

#include <jsi/jsi.h>
#include "WorkletsCache.h"
#include "SharedParent.h"

namespace reanimated {

using namespace facebook;

class FrozenObject : public jsi::HostObject {
  friend WorkletsCache;
  friend void extractMutables(jsi::Runtime &rt,
                              std::shared_ptr<ShareableValue> sv,
                              std::vector<std::shared_ptr<MutableValue>> &res);
  private:
  std::unordered_map<std::string, std::shared_ptr<ShareableValue>> map;

  public:

  FrozenObject(jsi::Runtime &rt, const jsi::Object &object, NativeReanimatedModule *module);

  // set is not available as the object is "read only" (to avoid locking)

  jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &name);
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &rt);

  std::shared_ptr<jsi::Object> shallowClone(jsi::Runtime &rt);
};

}
