#pragma once
#include <string>

namespace ABI47_0_0reanimated {

class FeaturesConfig {
 public:
  static inline bool isLayoutAnimationEnabled() {
    return _isLayoutAnimationEnabled;
  }
  static inline void setLayoutAnimationEnabled(bool isLayoutAnimationEnabled) {
    _isLayoutAnimationEnabled = isLayoutAnimationEnabled;
  }

 private:
  static bool _isLayoutAnimationEnabled;
};

} // namespace reanimated
