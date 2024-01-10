#include "RNCAndroidDialogPickerState.h"

namespace facebook
{
  namespace react
  {

#ifdef ANDROID
    folly::dynamic RNCAndroidDialogPickerState::getDynamic() const
    {
      return folly::dynamic::object("measuredHeight", measuredHeight);
    }
#endif

  } // namespace react
} // namespace facebook
