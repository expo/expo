#import <RNReanimated/ErrorHandler.h>
#import <RNReanimated/Scheduler.h>
#include <memory>
#include <string>

namespace reanimated {

class REAIOSErrorHandler : public ErrorHandler {
  std::shared_ptr<Scheduler> scheduler;
  void raiseSpec() override;
  std::shared_ptr<ErrorWrapper> error;

 public:
  REAIOSErrorHandler(std::shared_ptr<Scheduler> scheduler);
  std::shared_ptr<Scheduler> getScheduler() override;
  std::shared_ptr<ErrorWrapper> getError() override;
  void setError(std::string message) override;
  virtual ~REAIOSErrorHandler() {}
};

} // namespace reanimated
