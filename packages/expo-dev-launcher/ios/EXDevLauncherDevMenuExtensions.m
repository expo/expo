#import <EXDevLauncher/EXDevLauncherController.h>

@import EXDevMenuInterface;

@interface EXDevLauncherDevMenuExtensions : NSObject <RCTBridgeModule, EXDevExtensionProtocol>

@end

@implementation EXDevLauncherDevMenuExtensions


// Need to explicitly define `moduleName` here for dev menu to pick it up
RCT_EXTERN void RCTRegisterModule(Class);

+ (NSString *)moduleName
{
  return @"EXDevLauncherExtension";
}

+ (void)load
{
  RCTRegisterModule(self);
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

RCT_EXPORT_METHOD(navigateToLauncherAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [[EXDevLauncherController sharedInstance] navigateToLauncher];
  });
  resolve(nil);
}

@end
