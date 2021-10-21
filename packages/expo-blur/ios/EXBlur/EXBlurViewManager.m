// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBlur/EXBlurViewManager.h>
#import <ExpoModulesCore/EXUIManager.h>
#import "EXBlur-Swift.h"

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
  [view setIntensity:[value intValue]];
}

@end
