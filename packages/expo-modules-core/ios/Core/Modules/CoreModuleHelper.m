#import "CoreModuleHelper.h"

#ifdef EXPO_MODULES_CORE_VERSION
#define STRINGIZE(x) #x
#define STRINGIZE2(x) STRINGIZE(x)
#define EXPO_MODULES_CORE_VERSION_STRING STRINGIZE2(EXPO_MODULES_CORE_VERSION)
#endif

@implementation CoreModuleHelper

+ (NSString *)getVersion {
  return @EXPO_MODULES_CORE_VERSION_STRING;
}

@end
