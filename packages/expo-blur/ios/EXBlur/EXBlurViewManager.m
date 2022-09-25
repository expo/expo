// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBlur/EXBlurViewManager.h>
#import <ExpoModulesCore/EXUIManager.h>

#if __has_include(<EXBlur/EXBlur-Swift.h>)
#import <EXBlur/EXBlur-Swift.h>
#else
#import "EXBlur-Swift.h"
#endif

@interface EXBlurViewManager ()

@property (weak, nonatomic) EXModuleRegistry *moduleRegistry;

@end

@implementation EXBlurViewManager

EX_EXPORT_MODULE(ExpoBlurViewManager);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry {
  _moduleRegistry = moduleRegistry;
}

- (UIView *)view
{
  return [EXBlurView new];
}

- (NSString *)viewName
{
  return @"ExpoBlurView";
}

EX_VIEW_PROPERTY(tint, NSString *, EXBlurView)
{
  [view setTint:value];
}

EX_VIEW_PROPERTY(intensity, NSNumber *, EXBlurView)
{
  [view setIntensity:[value doubleValue] / 100];
}

EX_EXPORT_METHOD_AS(setNativeProps,
                    setNativeProps:(NSDictionary *)nativeProps
                    forViewWithTag:(id)viewTag
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [[_moduleRegistry getModuleImplementingProtocol:@protocol(EXUIManager)] executeUIBlock:^(id view) {
    if ([view isKindOfClass:[EXBlurView class]]) {
      EXBlurView *blurView = view;
      if (nativeProps[@"intensity"]) { [blurView setIntensity:[nativeProps[@"intensity"] floatValue] / 100]; }
      if (nativeProps[@"tint"]) { [blurView setTint:nativeProps[@"tint"]]; }
    } else {
      reject(@"E_INVALID_VIEW", [NSString stringWithFormat:@"Invalid view returned from registry, expected EXBlurView, got: %@", view], nil);
    }
  } forView:viewTag ofClass:[EXBlurView class]];
}

@end
