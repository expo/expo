#pragma once

#include <jsi/jsi.h>
#include <memory>
#include "ErrorHandler.h"
#include "JSIStoreValueUser.h"
#include "RuntimeDecorator.h"
#include "Scheduler.h"
#include "ShareableValue.h"
#include "WorkletsCache.h"

namespace reanimated {

using namespace facebook;

/**
 A class that manages a jsi::Runtime apart from the React-JS runtime.
 */
class RuntimeManager {
 public:
  RuntimeManager(
      std::shared_ptr<jsi::Runtime> runtime,
      std::shared_ptr<ErrorHandler> errorHandler,
      std::shared_ptr<Scheduler> scheduler,
      RuntimeType runtimeType = RuntimeType::Worklet)
      : runtime(runtime),
        errorHandler(errorHandler),
        scheduler(scheduler),
        workletsCache(std::make_unique<WorkletsCache>()),
        storeUserData(std::make_shared<StaticStoreUser>()) {
    RuntimeDecorator::registerRuntime(this->runtime.get(), runtimeType);
  }

  virtual ~RuntimeManager() {
    clearStore();
  }

 public:
  /**
   Holds the jsi::Function worklet that is responsible for updating values in
   JS. Can be null.
   */
  std::shared_ptr<ShareableValue> valueSetter;
  /**
   Holds the jsi::Runtime this RuntimeManager is managing.
   */
  std::shared_ptr<jsi::Runtime> runtime;
  /**
   Holds the error handler that will be invoked when any kind of error occurs.
   */
  std::shared_ptr<ErrorHandler> errorHandler;
  /**
   Holds the Scheduler that is responsible for scheduling work on the UI- or
   React-JS Thread.
   */
  std::shared_ptr<Scheduler> scheduler;
  /**
   Holds a list of adapted Worklets which are cached to avoid unneccessary
   recreation.
   */
  std::unique_ptr<WorkletsCache> workletsCache;
  /**
   Holds the JSI-Value Store where JSI::Values are cached on a
   per-RuntimeManager basis.
   */
  std::shared_ptr<StaticStoreUser> storeUserData;

 private:
  void clearStore() {
    const std::lock_guard<std::recursive_mutex> lock(storeUserData->storeMutex);
    storeUserData->store.clear();
  }
};

} // namespace reanimated
