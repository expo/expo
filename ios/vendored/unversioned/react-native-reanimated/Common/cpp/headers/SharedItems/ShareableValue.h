#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>
#include "HostFunctionHandler.h"
#include "JSIStoreValueUser.h"
#include "LayoutAnimationsProxy.h"
#include "RuntimeManager.h"
#include "Scheduler.h"
#include "SharedParent.h"
#include "ValueWrapper.h"
#include "WorkletsCache.h"

using namespace facebook;

namespace reanimated {

class ShareableValue : public std::enable_shared_from_this<ShareableValue>,
                       public StoreUser {
  friend WorkletsCache;
  friend FrozenObject;
  friend LayoutAnimationsProxy;
  friend void extractMutables(
      jsi::Runtime &rt,
      std::shared_ptr<ShareableValue> sv,
      std::vector<std::shared_ptr<MutableValue>> &res);

 private:
  RuntimeManager *runtimeManager;
  std::unique_ptr<ValueWrapper> valueContainer;
  std::unique_ptr<jsi::Value> hostValue;
  std::weak_ptr<jsi::Value> remoteValue;
  bool containsHostFunction = false;

  ShareableValue(RuntimeManager *runtimeManager, std::shared_ptr<Scheduler> s)
      : StoreUser(s, *runtimeManager), runtimeManager(runtimeManager) {}

  jsi::Value toJSValue(jsi::Runtime &rt);
  jsi::Object createHost(
      jsi::Runtime &rt,
      std::shared_ptr<jsi::HostObject> host);
  void adapt(jsi::Runtime &rt, const jsi::Value &value, ValueType objectType);
  void adaptCache(jsi::Runtime &rt, const jsi::Value &value);
  std::string demangleExceptionName(std::string toDemangle);

 public:
  ValueType type = ValueType::UndefinedType;
  static std::shared_ptr<ShareableValue> adapt(
      jsi::Runtime &rt,
      const jsi::Value &value,
      RuntimeManager *runtimeManager,
      ValueType objectType = ValueType::UndefinedType);
  jsi::Value getValue(jsi::Runtime &rt);
};

} // namespace reanimated
