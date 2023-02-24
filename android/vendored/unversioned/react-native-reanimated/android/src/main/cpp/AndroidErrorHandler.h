#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <memory>
#include <string>
#include "AndroidScheduler.h"
#include "ErrorHandler.h"
#include "Logger.h"
#include "Scheduler.h"

namespace reanimated {

class AndroidErrorHandler : public ErrorHandler {
  std::shared_ptr<ErrorWrapper> error;
  std::shared_ptr<Scheduler> scheduler;
  void raiseSpec() override;

 public:
  explicit AndroidErrorHandler(std::shared_ptr<Scheduler> scheduler);
  std::shared_ptr<Scheduler> getScheduler() override;
  std::shared_ptr<ErrorWrapper> getError() override;
  void setError(std::string message) override;
  virtual ~AndroidErrorHandler() {}
};

} // namespace reanimated
