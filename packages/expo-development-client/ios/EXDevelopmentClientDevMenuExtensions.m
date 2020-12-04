#import "EXDevelopmentClientController.h"

@import EXDevMenuInterface;

@interface EXDevelopmentClientDevMenuExtensions : NSObject <RCTBridgeModule, DevMenuExtensionProtocol>

@end

@implementation EXDevelopmentClientDevMenuExtensions

// Need to explicitly define `moduleName` here for dev menu to pick it up
RCT_EXTERN void RCTRegisterModule(Class);

+(NSString *)moduleName
{
  return @"ExpoDevelopmentClientDevMenuExtensions";
}
+(void)load
{
  RCTRegisterModule(self);
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

-(NSArray<DevMenuItem *> *)devMenuItems {
  DevMenuAction *backToLauncher = [[DevMenuAction alloc] initWithId:@"backToLauncher" action:^{
    dispatch_async(dispatch_get_main_queue(), ^{
      EXDevelopmentClientController *controller = [EXDevelopmentClientController sharedInstance];
      [controller navigateToLauncher];
    });
  }];
  backToLauncher.label = ^{ return @"Back to launcher"; };
  backToLauncher.glyphName = ^{ return @"exit-to-app"; };
  backToLauncher.importance = DevMenuItemImportanceHigh;
  [backToLauncher registerKeyCommandWithInput:@"L" modifiers:UIKeyModifierCommand];
  return @[backToLauncher];
}

@end
