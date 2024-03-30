#include "RNCAndroidDropdownPickerState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic RNCAndroidDropdownPickerState::getDynamic() const {
  return folly::dynamic::object("measuredHeight", measuredHeight);
}
#endif

} // namespace facebook::react
