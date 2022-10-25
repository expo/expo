// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXBlur/ABI47_0_0EXBlurViewManager.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXUIManager.h>

#if __has_include(<ABI47_0_0EXBlur/ABI47_0_0EXBlur-Swift.h>)
#import <ABI47_0_0EXBlur/ABI47_0_0EXBlur-Swift.h>
#else
#import "ABI47_0_0EXBlur-Swift.h"
#endif

@interface ABI47_0_0EXBlurViewManager ()

@property (weak, nonatomic) ABI47_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI47_0_0EXBlurViewManager

ABI47_0_0EX_EXPORT_MODULE(ExpoBlurViewManager);

- (void)setModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [ABI47_0_0EXBlurView new];
}

- (NSString *)viewName
{
  return @"ExpoBlurView";
}

ABI47_0_0EX_VIEW_PROPERTY(tint, NSString *, ABI47_0_0EXBlurView)
{
  [view setTint:value];
}

ABI47_0_0EX_VIEW_PROPERTY(intensity, NSNumber *, ABI47_0_0EXBlurView)
{
  [view setIntensity:[value doubleValue] / 100];
}

ABI47_0_0EX_EXPORT_METHOD_AS(setNativeProps,
                    setNativeProps:(NSDictionary *)nativeProps
                    forViewWithTag:(id)viewTag
                    resolver:(ABI47_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI47_0_0EXPromiseRejectBlock)reject)
{
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXUIManager)] executeUIBlock:^(id view) {
    if ([view isKindOfClass:[ABI47_0_0EXBlurView class]]) {
      ABI47_0_0EXBlurView *blurView = view;
      if (nativeProps[@"intensity"]) { [blurView setIntensity:[nativeProps[@"intensity"] floatValue] / 100]; }
      if (nativeProps[@"tint"]) { [blurView setTint:nativeProps[@"tint"]]; }
    } else {
      reject(@"E_INVALID_VIEW", [NSString stringWithFormat:@"Invalid view returned from registry, expected ABI47_0_0EXBlurView, got: %@", view], nil);
    }
  } forView:viewTag ofClass:[ABI47_0_0EXBlurView class]];
}

@end
