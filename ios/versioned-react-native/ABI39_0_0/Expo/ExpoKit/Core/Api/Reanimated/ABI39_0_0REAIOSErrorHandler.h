#pragma once

#include "ABI39_0_0ErrorHandler.h"
#include "ABI39_0_0Scheduler.h"

namespace ABI39_0_0reanimated {

class ABI39_0_0REAIOSErrorHandler : public ErrorHandler {
    std::shared_ptr<Scheduler> scheduler;
    void raiseSpec() override;
    std::shared_ptr<ErrorWrapper> error;
    public:
      ABI39_0_0REAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler);
      std::shared_ptr<Scheduler> getScheduler() override;
      std::shared_ptr<ErrorWrapper> getError() override;
      void setError(std::string message) override;
      virtual ~ABI39_0_0REAIOSErrorHandler() {}
};

}
