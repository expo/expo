#import "EXDevLauncherController.h"

@import EXDevMenuInterface;

@interface EXDevLauncherDevMenuExtensions : NSObject <RCTBridgeModule, DevMenuExtensionProtocol>

@end

@implementation EXDevLauncherDevMenuExtensions

// Need to explicitly define `moduleName` here for dev menu to pick it up
RCT_EXTERN void RCTRegisterModule(Class);

+ (NSString *)moduleName
{
  return @"ExpoDevelopmentClientDevMenuExtensions";
}

+ (void)load
{
  RCTRegisterModule(self);
}

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (id<DevMenuItemsContainerProtocol>)devMenuItems:(id<DevMenuExtensionSettingsProtocol>)settings
{
  if (![EXDevLauncherController.sharedInstance isAppRunning]) {
    return nil;
  }
  
  DevMenuItemsContainer *container = [DevMenuItemsContainer new];
  
  DevMenuAction *backToLauncher = [[DevMenuAction alloc] initWithId:@"backToLauncher" action:^{
    dispatch_async(dispatch_get_main_queue(), ^{
      EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];
      [controller navigateToLauncher];
    });
  }];
  backToLauncher.label = ^{ return @"Back to Launcher"; };
  backToLauncher.glyphName = ^{ return @"exit-to-app"; };
  backToLauncher.importance = DevMenuItemImportanceMedium;
  [backToLauncher registerKeyCommandWithInput:@"L" modifiers:UIKeyModifierCommand];
  
  [container addItem:backToLauncher];
  return container;
}

@end
