#import <Foundation/Foundation.h>

// Forward-declared React types. The React.xcframework is linked but its
// headers require a VFS overlay to import, so we declare the minimal
// types needed to define a bridge module directly.
typedef void (^RCTPromiseResolveBlock)(id result);
typedef void (^RCTPromiseRejectBlock)(NSString *code, NSString *message, NSError *error);

typedef struct RCTMethodInfo {
  const char *const jsName;
  const char *const objcName;
  const BOOL isSync;
} RCTMethodInfo;

@protocol RCTBridgeModule <NSObject>
+ (NSString *)moduleName;
@optional
+ (BOOL)requiresMainQueueSetup;
@end

@interface BrownfieldTestModule : NSObject <RCTBridgeModule>
@end

@implementation BrownfieldTestModule

+ (NSString *)moduleName {
  return @"BrownfieldTestModule";
}

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

+ (const RCTMethodInfo *)__rct_export__getGreeting {
  static RCTMethodInfo info = {
    "",
    "getGreeting:(NSString *)name resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject",
    NO
  };
  return &info;
}

- (void)getGreeting:(NSString *)name
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  resolve([NSString stringWithFormat:@"Hello, %@! From the iOS hosting app.", name]);
}

@end
