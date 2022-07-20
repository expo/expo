#import "DevMenuReanimatedHiddenHeaders.h"
#include <stdio.h>

namespace devmenureanimated {

class DevMenuREAIOSLogger : public LoggerInterface {
 public:
  void log(const char *str) override;
  void log(double d) override;
  void log(int i) override;
  void log(bool b) override;
  virtual ~DevMenuREAIOSLogger() {}
};

} // namespace devmenureanimated
