#pragma once

#include "WorkletsCache.h"
#include "SharedParent.h"
#include "ValueWrapper.h"
#include "HostFunctionHandler.h"
#include "JSIStoreValueUser.h"
#include <string>
#include <mutex>
#include <unordered_map>
#include <jsi/jsi.h>

using namespace facebook;

namespace reanimated {

class ShareableValue: public std::enable_shared_from_this<ShareableValue>, public StoreUser {
friend WorkletsCache;
friend FrozenObject;
friend void extractMutables(jsi::Runtime &rt,
                            std::shared_ptr<ShareableValue> sv,
                            std::vector<std::shared_ptr<MutableValue>> &res);

private:
  NativeReanimatedModule *module;
  std::unique_ptr<ValueWrapper> valueContainer;
  std::unique_ptr<jsi::Value> hostValue;
  std::weak_ptr<jsi::Value> remoteValue;
  bool containsHostFunction = false;

  ShareableValue(NativeReanimatedModule *module, std::shared_ptr<Scheduler> s): StoreUser(s), module(module) {}

  jsi::Value toJSValue(jsi::Runtime &rt);
  jsi::Object createHost(jsi::Runtime &rt, std::shared_ptr<jsi::HostObject> host);
  void adapt(jsi::Runtime &rt, const jsi::Value &value, ValueType objectType);
  void adaptCache(jsi::Runtime &rt, const jsi::Value &value);

public:
  ValueType type = ValueType::UndefinedType;
  static std::shared_ptr<ShareableValue> adapt(
    jsi::Runtime &rt,
    const jsi::Value &value,
    NativeReanimatedModule *module,
    ValueType objectType = ValueType::UndefinedType
  );
  jsi::Value getValue(jsi::Runtime &rt);

};

}
