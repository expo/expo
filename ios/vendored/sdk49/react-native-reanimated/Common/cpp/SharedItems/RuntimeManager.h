#pragma once

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include <memory>
#include "ErrorHandler.h"
#include "RuntimeDecorator.h"
#include "Scheduler.h"

namespace ABI49_0_0reanimated {

using namespace ABI49_0_0facebook;

/**
 A class that manages a jsi::Runtime apart from the ABI49_0_0React-JS runtime.
 */
class RuntimeManager {
 public:
  RuntimeManager(
      std::shared_ptr<jsi::Runtime> runtime,
      std::shared_ptr<ErrorHandler> errorHandler,
      std::shared_ptr<Scheduler> scheduler,
      RuntimeType runtimeType = RuntimeType::Worklet)
      : runtime(runtime), errorHandler(errorHandler), scheduler(scheduler) {
    RuntimeDecorator::registerRuntime(this->runtime.get(), runtimeType);
  }

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
   ABI49_0_0React-JS Thread.
   */
  std::shared_ptr<Scheduler> scheduler;
};

} // namespace reanimated
