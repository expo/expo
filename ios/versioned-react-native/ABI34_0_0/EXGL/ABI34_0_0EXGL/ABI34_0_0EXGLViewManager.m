// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXGL/ABI34_0_0EXGLView.h>
#import <ABI34_0_0EXGL/ABI34_0_0EXGLViewManager.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMUIManager.h>

@interface ABI34_0_0EXGLViewManager ()

@property (nonatomic, weak) ABI34_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI34_0_0EXGLViewManager

ABI34_0_0UM_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI34_0_0EXGLView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExponentGLView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSurfaceCreate"];
}

ABI34_0_0UM_VIEW_PROPERTY(msaaSamples, NSNumber *, ABI34_0_0EXGLView)
{
  [view setMsaaSamples:value];
}

- (void)setModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
