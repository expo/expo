#include "ReanimatedVersion.h"

#ifdef REANIMATED_VERSION
#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)
#define REANIMATED_VERSION_STRING STRINGIZE2(REANIMATED_VERSION)
#endif // REANIMATED_VERSION

using namespace facebook;

namespace reanimated {

jsi::String getReanimatedVersionString(jsi::Runtime &rt) {
  return jsi::String::createFromUtf8(rt, REANIMATED_VERSION_STRING);
}

}; // namespace reanimated
