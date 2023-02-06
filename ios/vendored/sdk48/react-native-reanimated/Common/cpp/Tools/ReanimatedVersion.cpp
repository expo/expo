#include "ReanimatedVersion.h"

#ifdef ABI48_0_0REANIMATED_VERSION
#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)
#define ABI48_0_0REANIMATED_VERSION_STRING STRINGIZE2(ABI48_0_0REANIMATED_VERSION)
#endif // ABI48_0_0REANIMATED_VERSION

using namespace ABI48_0_0facebook;

namespace ABI48_0_0reanimated {

jsi::String getReanimatedVersionString(jsi::Runtime &rt) {
  return jsi::String::createFromUtf8(rt, ABI48_0_0REANIMATED_VERSION_STRING);
}

}; // namespace reanimated
