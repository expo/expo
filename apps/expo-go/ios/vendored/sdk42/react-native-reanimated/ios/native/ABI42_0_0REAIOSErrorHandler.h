#pragma once

#include "ErrorHandler.h"
#include "Scheduler.h"

namespace ABI42_0_0reanimated {

class ABI42_0_0REAIOSErrorHandler : public ErrorHandler {
    std::shared_ptr<Scheduler> scheduler;
    void raiseSpec() override;
    std::shared_ptr<ErrorWrapper> error;
    public:
      ABI42_0_0REAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler);
      std::shared_ptr<Scheduler> getScheduler() override;
      std::shared_ptr<ErrorWrapper> getError() override;
      void setError(std::string message) override;
      virtual ~ABI42_0_0REAIOSErrorHandler() {}
};

}
