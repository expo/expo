// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXModuleTemplate/ABI38_0_0EXModuleTemplateView.h>
#import <ABI38_0_0EXModuleTemplate/ABI38_0_0EXModuleTemplateViewManager.h>

@interface ABI38_0_0EXModuleTemplateViewManager ()

@property (nonatomic, weak) ABI38_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI38_0_0EXModuleTemplateViewManager

ABI38_0_0UM_EXPORT_MODULE(ExpoModuleTemplateViewManager);

- (UIView *)view
{
  return [[ABI38_0_0EXModuleTemplateView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoModuleTemplateView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSomethingHappened"];
}

- (void)setModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
