#include "ReanimatedVersion.h"

#ifdef ABI49_0_0REANIMATED_VERSION
#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)
#define ABI49_0_0REANIMATED_VERSION_STRING STRINGIZE2(ABI49_0_0REANIMATED_VERSION)
#endif // ABI49_0_0REANIMATED_VERSION

using namespace ABI49_0_0facebook;

namespace ABI49_0_0reanimated {

jsi::String getReanimatedVersionString(jsi::Runtime &rt) {
  return jsi::String::createFromUtf8(rt, ABI49_0_0REANIMATED_VERSION_STRING);
}

}; // namespace reanimated
