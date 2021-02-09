#import <Foundation/Foundation.h>

#include <EXGL_CPP/EXPlatformUtils.h>

namespace expo {
namespace gl_cpp {

void EXiOSLog(const char *msg, ...) {
  va_list args;
  va_start(args, msg);
  NSLog(@"%@", [[NSString alloc] initWithFormat:[NSString stringWithUTF8String:msg]
                                      arguments:args]);
  va_end(args);
}

EXiOSOperatingSystemVersion EXiOSGetOperatingSystemVersion() {
  NSOperatingSystemVersion version = NSProcessInfo.processInfo.operatingSystemVersion;
  return EXiOSOperatingSystemVersion {
    version.majorVersion,
    version.minorVersion,
    version.patchVersion,
  };
}
}
}
