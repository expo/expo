// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXGL/ABI32_0_0EXGLView.h>
#import <ABI32_0_0EXGL/ABI32_0_0EXGLViewManager.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXUIManager.h>

@interface ABI32_0_0EXGLViewManager ()

@property (nonatomic, weak) ABI32_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI32_0_0EXGLViewManager

ABI32_0_0EX_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI32_0_0EXGLView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExponentGLView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSurfaceCreate"];
}

ABI32_0_0EX_VIEW_PROPERTY(msaaSamples, NSNumber *, ABI32_0_0EXGLView)
{
  [view setMsaaSamples:value];
}

- (void)setModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
