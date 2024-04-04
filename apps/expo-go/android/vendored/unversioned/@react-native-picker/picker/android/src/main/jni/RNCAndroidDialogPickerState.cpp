#include "RNCAndroidDialogPickerState.h"

namespace facebook::react {

#ifdef ANDROID
folly::dynamic RNCAndroidDialogPickerState::getDynamic() const {
  return folly::dynamic::object("measuredHeight", measuredHeight);
}
#endif

} // namespace facebook::react
