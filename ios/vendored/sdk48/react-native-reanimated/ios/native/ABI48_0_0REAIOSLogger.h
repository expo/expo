#import <ABI48_0_0RNReanimated/ReanimatedHiddenHeaders.h>
#include <stdio.h>

namespace ABI48_0_0reanimated {

class ABI48_0_0REAIOSLogger : public LoggerInterface {
 public:
  void log(const char *str) override;
  void log(double d) override;
  void log(int i) override;
  void log(bool b) override;
  virtual ~ABI48_0_0REAIOSLogger() {}
};

} // namespace reanimated
