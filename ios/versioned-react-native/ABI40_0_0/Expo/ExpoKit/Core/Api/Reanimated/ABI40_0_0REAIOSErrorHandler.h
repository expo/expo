#pragma once

#include "ABI40_0_0ErrorHandler.h"
#include "ABI40_0_0Scheduler.h"

namespace ABI40_0_0reanimated {

class ABI40_0_0REAIOSErrorHandler : public ErrorHandler {
    std::shared_ptr<Scheduler> scheduler;
    void raiseSpec() override;
    std::shared_ptr<ErrorWrapper> error;
    public:
      ABI40_0_0REAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler);
      std::shared_ptr<Scheduler> getScheduler() override;
      std::shared_ptr<ErrorWrapper> getError() override;
      void setError(std::string message) override;
      virtual ~ABI40_0_0REAIOSErrorHandler() {}
};

}
