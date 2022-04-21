// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXGL/ABI45_0_0EXGLView.h>
#import <ABI45_0_0EXGL/ABI45_0_0EXGLViewManager.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXUIManager.h>

@interface ABI45_0_0EXGLViewManager ()

@property (nonatomic, weak) ABI45_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI45_0_0EXGLViewManager

ABI45_0_0EX_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI45_0_0EXGLView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExponentGLView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSurfaceCreate"];
}

ABI45_0_0EX_VIEW_PROPERTY(msaaSamples, NSNumber *, ABI45_0_0EXGLView)
{
  [view setMsaaSamples:value];
}

- (void)setModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
