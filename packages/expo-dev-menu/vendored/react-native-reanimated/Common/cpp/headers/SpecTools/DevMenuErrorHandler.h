#pragma once

#include <memory>
#include <string>
#include "DevMenuScheduler.h"

namespace devmenureanimated {

struct ErrorWrapper {
  std::string message = "";
  bool handled = true;
};

class ErrorHandler {
 public:
  bool raise() {
    if (getError()->handled) {
      return false;
    }
    this->getScheduler()->scheduleOnUI([this]() mutable { this->raiseSpec(); });
    return true;
  }
  virtual std::shared_ptr<Scheduler> getScheduler() = 0;
  virtual std::shared_ptr<ErrorWrapper> getError() = 0;
  virtual void setError(std::string message) = 0;
  virtual ~ErrorHandler() {}

 protected:
  virtual void raiseSpec() = 0;
};

} // namespace devmenureanimated
