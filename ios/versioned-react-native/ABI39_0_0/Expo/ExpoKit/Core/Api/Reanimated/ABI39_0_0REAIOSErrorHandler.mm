#include "ABI39_0_0REAIOSErrorHandler.h"
#import <Foundation/Foundation.h>
#import <ABI39_0_0React/ABI39_0_0RCTLog.h>


namespace ABI39_0_0reanimated {

ABI39_0_0REAIOSErrorHandler::ABI39_0_0REAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler) {
    this->scheduler = scheduler;
    error = std::make_shared<ErrorWrapper>();
}

void ABI39_0_0REAIOSErrorHandler::raiseSpec() {
    if (error->handled) {
        return;
    }
    ABI39_0_0RCTLogError(@(error->message.c_str()));
    this->error->handled = true;
}

std::shared_ptr<Scheduler> ABI39_0_0REAIOSErrorHandler::getScheduler() {
    return this->scheduler;
}

std::shared_ptr<ErrorWrapper> ABI39_0_0REAIOSErrorHandler::getError() {
    return this->error;
}

void ABI39_0_0REAIOSErrorHandler::setError(std::string message) {
  if (error->handled) {
    error->message = message;
    error->handled = false;
  }
}

}
