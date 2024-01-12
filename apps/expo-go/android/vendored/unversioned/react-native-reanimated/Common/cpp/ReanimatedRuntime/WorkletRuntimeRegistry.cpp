#include "WorkletRuntimeRegistry.h"

namespace reanimated {

std::set<jsi::Runtime *> WorkletRuntimeRegistry::registry_{};
std::mutex WorkletRuntimeRegistry::mutex_{};

} // namespace reanimated
