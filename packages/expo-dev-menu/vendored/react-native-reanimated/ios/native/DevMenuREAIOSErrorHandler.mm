#import <Foundation/Foundation.h>
#import "DevMenuREAIOSErrorHandler.h"
#import <React/RCTLog.h>

namespace devmenureanimated {

DevMenuREAIOSErrorHandler::DevMenuREAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler)
{
  this->scheduler = scheduler;
  error = std::make_shared<ErrorWrapper>();
}

void DevMenuREAIOSErrorHandler::raiseSpec()
{
  if (error->handled) {
    return;
  }
  RCTLogError(@(error->message.c_str()));
  this->error->handled = true;
}

std::shared_ptr<Scheduler> DevMenuREAIOSErrorHandler::getScheduler()
{
  return this->scheduler;
}

std::shared_ptr<ErrorWrapper> DevMenuREAIOSErrorHandler::getError()
{
  return this->error;
}

void DevMenuREAIOSErrorHandler::setError(std::string message)
{
  if (error->handled) {
    error->message = message;
    error->handled = false;
  }
}

}
