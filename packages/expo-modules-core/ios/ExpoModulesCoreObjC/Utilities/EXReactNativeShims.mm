// Copyright 2026-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactNativeShims.h>
#import <React/RCTReloadCommand.h>
#import <React/RCTEventDispatcherProtocol.h>

@implementation EXReactReloadCommand

+ (void)triggerWithReason:(NSString *)reason
{
  RCTTriggerReloadCommandListeners(reason);
}

@end

@implementation EXReactEventName

+ (NSString *)normalizeInput:(NSString *)name
{
  return RCTNormalizeInputEventName(name);
}

@end

#if !TARGET_OS_OSX
#import <React/UIView+React.h>

@implementation EXReactView

+ (UIViewController *)parentControllerOf:(UIView *)view
{
  return [view reactViewController];
}

@end
#endif
