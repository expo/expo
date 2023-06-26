#import <Foundation/Foundation.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REAIOSErrorHandler.h>
#import <ABI49_0_0React/ABI49_0_0RCTLog.h>

namespace ABI49_0_0reanimated {

ABI49_0_0REAIOSErrorHandler::ABI49_0_0REAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler)
{
  this->scheduler = scheduler;
  error = std::make_shared<ErrorWrapper>();
}

void ABI49_0_0REAIOSErrorHandler::raiseSpec()
{
  if (error->handled) {
    return;
  }
  ABI49_0_0RCTLogError(@(error->message.c_str()));
  this->error->handled = true;
}

std::shared_ptr<Scheduler> ABI49_0_0REAIOSErrorHandler::getScheduler()
{
  return this->scheduler;
}

std::shared_ptr<ErrorWrapper> ABI49_0_0REAIOSErrorHandler::getError()
{
  return this->error;
}

void ABI49_0_0REAIOSErrorHandler::setError(std::string message)
{
  if (error->handled) {
    error->message = message;
    error->handled = false;
  }
}

} // namespace reanimated
