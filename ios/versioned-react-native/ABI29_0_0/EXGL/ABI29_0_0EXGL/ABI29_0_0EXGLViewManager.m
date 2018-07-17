// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXGL/ABI29_0_0EXGLView.h>
#import <ABI29_0_0EXGL/ABI29_0_0EXGLViewManager.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXUIManager.h>

@interface ABI29_0_0EXGLViewManager ()

@property (nonatomic, weak) ABI29_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI29_0_0EXGLViewManager

ABI29_0_0EX_EXPORT_MODULE(ExponentGLViewManager);

- (UIView *)view
{
  return [[ABI29_0_0EXGLView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExponentGLView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSurfaceCreate"];
}

ABI29_0_0EX_VIEW_PROPERTY(msaaSamples, NSNumber *, ABI29_0_0EXGLView)
{
  [view setMsaaSamples:value];
}

- (void)setModuleRegistry:(ABI29_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
