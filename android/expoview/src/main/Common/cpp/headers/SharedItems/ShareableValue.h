#pragma once

#include "WorkletsCache.h"
#include "SharedParent.h"
#include "ValueWrapper.h"
#include "HostFunctionHandler.h"
#include "JSIStoreValueUser.h"
#include "RuntimeManager.h"
#include "Scheduler.h"
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
  RuntimeManager *runtimeManager;
  std::unique_ptr<ValueWrapper> valueContainer;
  std::unique_ptr<jsi::Value> hostValue;
  std::weak_ptr<jsi::Value> remoteValue;
  bool containsHostFunction = false;

  ShareableValue(RuntimeManager *runtimeManager, std::shared_ptr<Scheduler> s): StoreUser(s), runtimeManager(runtimeManager) {}

  jsi::Value toJSValue(jsi::Runtime &rt);
  jsi::Object createHost(jsi::Runtime &rt, std::shared_ptr<jsi::HostObject> host);
  void adapt(jsi::Runtime &rt, const jsi::Value &value, ValueType objectType);
  void adaptCache(jsi::Runtime &rt, const jsi::Value &value);

public:
  ValueType type = ValueType::UndefinedType;
  static std::shared_ptr<ShareableValue> adapt(
    jsi::Runtime &rt,
    const jsi::Value &value,
    RuntimeManager *runtimeManager,
    ValueType objectType = ValueType::UndefinedType
  );
  jsi::Value getValue(jsi::Runtime &rt);

};

}
