#import "DevMenuErrorHandler.h"
#import "DevMenuScheduler.h"
#include <memory>
#include <string>

namespace devmenureanimated {

class DevMenuREAIOSErrorHandler : public ErrorHandler {
  std::shared_ptr<Scheduler> scheduler;
  void raiseSpec() override;
  std::shared_ptr<ErrorWrapper> error;

 public:
  DevMenuREAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler);
  std::shared_ptr<Scheduler> getScheduler() override;
  std::shared_ptr<ErrorWrapper> getError() override;
  void setError(std::string message) override;
  virtual ~DevMenuREAIOSErrorHandler() {}
};

} // namespace devmenureanimated
