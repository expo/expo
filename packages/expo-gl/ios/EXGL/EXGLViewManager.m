// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXGL/EXGLView.h>
#import <EXGL/EXGLViewManager.h>
#import <EXCore/EXUIManager.h>

@interface EXGLViewManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXGLViewManager

EX_EXPORT_MODULE(ExponentGLViewManager);

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

EX_VIEW_PROPERTY(msaaSamples, NSNumber *, EXGLView)
{
  [view setMsaaSamples:value];
}

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
