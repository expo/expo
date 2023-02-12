#import <Foundation/Foundation.h>

#include <ABI48_0_0ExpoGL/ABI48_0_0EXPlatformUtils.h>

namespace ABI48_0_0expo {
namespace gl_cpp {

void ABI48_0_0EXiOSLog(const char *msg, ...) {
  va_list args;
  va_start(args, msg);
  NSLog(@"%@", [[NSString alloc] initWithFormat:[NSString stringWithUTF8String:msg]
                                      arguments:args]);
  va_end(args);
}

ABI48_0_0EXiOSOperatingSystemVersion ABI48_0_0EXiOSGetOperatingSystemVersion() {
  NSOperatingSystemVersion version = NSProcessInfo.processInfo.operatingSystemVersion;
  return ABI48_0_0EXiOSOperatingSystemVersion {
    version.majorVersion,
    version.minorVersion,
    version.patchVersion,
  };
}
}
}
