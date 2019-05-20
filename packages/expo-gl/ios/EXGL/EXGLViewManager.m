// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXGL/EXGLView.h>
#import <EXGL/EXGLViewManager.h>
#import <UMCore/UMUIManager.h>

@interface EXGLViewManager ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXGLViewManager

UM_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[EXGLView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExponentGLView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSurfaceCreate"];
}

UM_VIEW_PROPERTY(msaaSamples, NSNumber *, EXGLView)
{
  [view setMsaaSamples:value];
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
