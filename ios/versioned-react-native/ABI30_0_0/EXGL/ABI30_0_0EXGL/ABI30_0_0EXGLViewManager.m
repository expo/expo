// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXGL/ABI30_0_0EXGLView.h>
#import <ABI30_0_0EXGL/ABI30_0_0EXGLViewManager.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXUIManager.h>

@interface ABI30_0_0EXGLViewManager ()

@property (nonatomic, weak) ABI30_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI30_0_0EXGLViewManager

ABI30_0_0EX_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI30_0_0EXGLView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExponentGLView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSurfaceCreate"];
}

ABI30_0_0EX_VIEW_PROPERTY(msaaSamples, NSNumber *, ABI30_0_0EXGLView)
{
  [view setMsaaSamples:value];
}

- (void)setModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
