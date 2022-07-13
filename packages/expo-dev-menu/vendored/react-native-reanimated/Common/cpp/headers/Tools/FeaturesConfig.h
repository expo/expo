#pragma once
#include <string>

namespace devmenureanimated {

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

} // namespace devmenureanimated
