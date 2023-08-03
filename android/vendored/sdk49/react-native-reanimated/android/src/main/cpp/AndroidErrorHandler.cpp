#include "AndroidErrorHandler.h"
#include <fbjni/fbjni.h>
#include <exception>
#include <string>
#include "Logger.h"

namespace reanimated {

using namespace facebook::jni;

AndroidErrorHandler::AndroidErrorHandler(std::shared_ptr<Scheduler> scheduler) {
  this->scheduler = scheduler;
  this->error = std::make_shared<ErrorWrapper>();
}

void AndroidErrorHandler::raiseSpec() {
  if (error->handled) {
    return;
  }

  // mark error as handled before this method throws exception
  this->error->handled = true;
  throw std::runtime_error(this->error->message);
}

std::shared_ptr<Scheduler> AndroidErrorHandler::getScheduler() {
  return this->scheduler;
}

std::shared_ptr<ErrorWrapper> AndroidErrorHandler::getError() {
  return this->error;
}

void AndroidErrorHandler::setError(std::string message) {
  if (error->handled) {
    error->message = message;
    error->handled = false;
  }
}

} // namespace reanimated
