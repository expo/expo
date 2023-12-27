#include "ABI44_0_0REAIOSErrorHandler.h"
#import <Foundation/Foundation.h>
#import <ABI44_0_0React/ABI44_0_0RCTLog.h>

namespace ABI44_0_0reanimated {

ABI44_0_0REAIOSErrorHandler::ABI44_0_0REAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler)
{
  this->scheduler = scheduler;
  error = std::make_shared<ErrorWrapper>();
}

void ABI44_0_0REAIOSErrorHandler::raiseSpec()
{
  if (error->handled) {
    return;
  }
  ABI44_0_0RCTLogError(@(error->message.c_str()));
  this->error->handled = true;
}

std::shared_ptr<Scheduler> ABI44_0_0REAIOSErrorHandler::getScheduler()
{
  return this->scheduler;
}

std::shared_ptr<ErrorWrapper> ABI44_0_0REAIOSErrorHandler::getError()
{
  return this->error;
}

void ABI44_0_0REAIOSErrorHandler::setError(std::string message)
{
  if (error->handled) {
    error->message = message;
    error->handled = false;
  }
}

}
