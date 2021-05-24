// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXDevLauncherRCTBridge.h"
#import <React/RCTPerformanceLogger.h>
#import <React/RCTDevSettings.h>
#import <React/RCTDevMenu.h>

@implementation EXDevLauncherRCTCxxBridge

/**
 * Theoretically, we could overwrite the `RCTDevSettings` module by exporting our version through the bridge.
 * However, this won't work with the js remote debugging. For some reason, the RN needs to initialized remote tools very early. So it always uses the default module to do it.
 * When we export our module, it won't be used in the initialized phase. So the launcher will start with remote debug support.
 */
- (RCTDevSettings *)devSettings
{
  return nil;
}

- (RCTDevMenu *)devMenu
{
  return nil;
}

@end

@implementation EXDevLauncherRCTBridge

- (Class)bridgeClass
{
  return [EXDevLauncherRCTCxxBridge class];
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
// This method is still used so we need to override it even if it's deprecated
- (void)reloadWithReason:(NSString *)reason {}
#pragma clang diagnostic pop

@end
