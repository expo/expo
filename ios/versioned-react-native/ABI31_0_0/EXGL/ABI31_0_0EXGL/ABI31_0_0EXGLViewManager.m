// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXGL/ABI31_0_0EXGLView.h>
#import <ABI31_0_0EXGL/ABI31_0_0EXGLViewManager.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXUIManager.h>

@interface ABI31_0_0EXGLViewManager ()

@property (nonatomic, weak) ABI31_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI31_0_0EXGLViewManager

ABI31_0_0EX_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI31_0_0EXGLView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExponentGLView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSurfaceCreate"];
}

ABI31_0_0EX_VIEW_PROPERTY(msaaSamples, NSNumber *, ABI31_0_0EXGLView)
{
  [view setMsaaSamples:value];
}

- (void)setModuleRegistry:(ABI31_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
