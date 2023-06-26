#import <Foundation/Foundation.h>

#include <ABI49_0_0ExpoGL/ABI49_0_0EXPlatformUtils.h>

namespace ABI49_0_0expo {
namespace gl_cpp {

void ABI49_0_0EXiOSLog(const char *msg, ...) {
  va_list args;
  va_start(args, msg);
  NSLog(@"%@", [[NSString alloc] initWithFormat:[NSString stringWithUTF8String:msg]
                                      arguments:args]);
  va_end(args);
}

ABI49_0_0EXiOSOperatingSystemVersion ABI49_0_0EXiOSGetOperatingSystemVersion() {
  NSOperatingSystemVersion version = NSProcessInfo.processInfo.operatingSystemVersion;
  return ABI49_0_0EXiOSOperatingSystemVersion {
    version.majorVersion,
    version.minorVersion,
    version.patchVersion,
  };
}
}
}
