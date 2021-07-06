#include "ABI40_0_0REAIOSErrorHandler.h"
#import <Foundation/Foundation.h>
#import <ABI40_0_0React/ABI40_0_0RCTLog.h>


namespace ABI40_0_0reanimated {

ABI40_0_0REAIOSErrorHandler::ABI40_0_0REAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler) {
    this->scheduler = scheduler;
    error = std::make_shared<ErrorWrapper>();
}

void ABI40_0_0REAIOSErrorHandler::raiseSpec() {
    if (error->handled) {
        return;
    }
    ABI40_0_0RCTLogError(@(error->message.c_str()));
    this->error->handled = true;
}

std::shared_ptr<Scheduler> ABI40_0_0REAIOSErrorHandler::getScheduler() {
    return this->scheduler;
}

std::shared_ptr<ErrorWrapper> ABI40_0_0REAIOSErrorHandler::getError() {
    return this->error;
}

void ABI40_0_0REAIOSErrorHandler::setError(std::string message) {
  if (error->handled) {
    error->message = message;
    error->handled = false;
  }
}

}
