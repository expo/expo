#import <Foundation/Foundation.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0REAIOSErrorHandler.h>
#import <ABI48_0_0React/ABI48_0_0RCTLog.h>

namespace ABI48_0_0reanimated {

ABI48_0_0REAIOSErrorHandler::ABI48_0_0REAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler)
{
  this->scheduler = scheduler;
  error = std::make_shared<ErrorWrapper>();
}

void ABI48_0_0REAIOSErrorHandler::raiseSpec()
{
  if (error->handled) {
    return;
  }
  ABI48_0_0RCTLogError(@(error->message.c_str()));
  this->error->handled = true;
}

std::shared_ptr<Scheduler> ABI48_0_0REAIOSErrorHandler::getScheduler()
{
  return this->scheduler;
}

std::shared_ptr<ErrorWrapper> ABI48_0_0REAIOSErrorHandler::getError()
{
  return this->error;
}

void ABI48_0_0REAIOSErrorHandler::setError(std::string message)
{
  if (error->handled) {
    error->message = message;
    error->handled = false;
  }
}

}
