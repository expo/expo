#include "DevMenuReanimatedVersion.h"

#ifdef REANIMATED_VERSION
#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)
#define REANIMATED_VERSION_STRING STRINGIZE2(REANIMATED_VERSION)
#endif // REANIMATED_VERSION

using namespace facebook;

namespace devmenureanimated {

jsi::String getReanimatedVersionString(jsi::Runtime &rt) {
  return jsi::String::createFromUtf8(rt, "2.14.4");
}

}; // namespace devmenureanimated
