// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXGL/ABI38_0_0EXGLView.h>
#import <ABI38_0_0EXGL/ABI38_0_0EXGLViewManager.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMUIManager.h>

@interface ABI38_0_0EXGLViewManager ()

@property (nonatomic, weak) ABI38_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI38_0_0EXGLViewManager

ABI38_0_0UM_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI38_0_0EXGLView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExponentGLView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSurfaceCreate"];
}

ABI38_0_0UM_VIEW_PROPERTY(msaaSamples, NSNumber *, ABI38_0_0EXGLView)
{
  [view setMsaaSamples:value];
}

- (void)setModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
