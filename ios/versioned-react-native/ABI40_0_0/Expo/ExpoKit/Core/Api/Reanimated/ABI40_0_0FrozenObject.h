#pragma once

#include "ABI40_0_0WorkletsCache.h"
#include "ABI40_0_0SharedParent.h"
#include <ABI40_0_0jsi/ABI40_0_0jsi.h>

using namespace ABI40_0_0facebook;

namespace ABI40_0_0reanimated {

class FrozenObject : public jsi::HostObject {
  friend WorkletsCache;
  friend void extractMutables(jsi::Runtime &rt,
                              std::shared_ptr<ShareableValue> sv,
                              std::vector<std::shared_ptr<MutableValue>> &res);
  friend jsi::Value createFrozenWrapper(ShareableValue *sv,
                                        jsi::Runtime &rt,
                                        std::shared_ptr<FrozenObject> frozenObject);
  
  private:
  std::unordered_map<std::string, std::shared_ptr<ShareableValue>> map;

  public:

  FrozenObject(jsi::Runtime &rt, const jsi::Object &object, NativeReanimatedModule *module);
  jsi::Object shallowClone(jsi::Runtime &rt);
};

}
