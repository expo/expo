#ifdef RCT_NEW_ARCH_ENABLED

#include "ReanimatedCommitMarker.h"

#include <react/debug/react_native_assert.h>

namespace reanimated {

thread_local bool ReanimatedCommitMarker::reanimatedCommitFlag_{false};

ReanimatedCommitMarker::ReanimatedCommitMarker() {
  react_native_assert(reanimatedCommitFlag_ != true);
  reanimatedCommitFlag_ = true;
}

ReanimatedCommitMarker::~ReanimatedCommitMarker() {
  reanimatedCommitFlag_ = false;
}

bool ReanimatedCommitMarker::isReanimatedCommit() {
  return reanimatedCommitFlag_;
}

} // namespace reanimated

#endif // RCT_NEW_ARCH_ENABLED
