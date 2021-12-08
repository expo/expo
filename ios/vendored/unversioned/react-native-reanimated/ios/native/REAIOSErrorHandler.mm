#include "REAIOSErrorHandler.h"
#import <Foundation/Foundation.h>
#import <React/RCTLog.h>

namespace reanimated {

REAIOSErrorHandler::REAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler)
{
  this->scheduler = scheduler;
  error = std::make_shared<ErrorWrapper>();
}

void REAIOSErrorHandler::raiseSpec()
{
  if (error->handled) {
    return;
  }
  RCTLogError(@(error->message.c_str()));
  this->error->handled = true;
}

std::shared_ptr<Scheduler> REAIOSErrorHandler::getScheduler()
{
  return this->scheduler;
}

std::shared_ptr<ErrorWrapper> REAIOSErrorHandler::getError()
{
  return this->error;
}

void REAIOSErrorHandler::setError(std::string message)
{
  if (error->handled) {
    error->message = message;
    error->handled = false;
  }
}

}
