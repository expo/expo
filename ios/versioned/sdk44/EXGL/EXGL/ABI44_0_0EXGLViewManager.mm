// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXGL/ABI44_0_0EXGLView.h>
#import <ABI44_0_0EXGL/ABI44_0_0EXGLViewManager.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXUIManager.h>

@interface ABI44_0_0EXGLViewManager ()

@property (nonatomic, weak) ABI44_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI44_0_0EXGLViewManager

ABI44_0_0EX_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI44_0_0EXGLView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExponentGLView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSurfaceCreate"];
}

ABI44_0_0EX_VIEW_PROPERTY(msaaSamples, NSNumber *, ABI44_0_0EXGLView)
{
  [view setMsaaSamples:value];
}

- (void)setModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
