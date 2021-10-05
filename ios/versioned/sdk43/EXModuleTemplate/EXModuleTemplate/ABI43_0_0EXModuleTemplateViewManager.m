// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXModuleTemplate/ABI43_0_0EXModuleTemplateView.h>
#import <ABI43_0_0EXModuleTemplate/ABI43_0_0EXModuleTemplateViewManager.h>

@interface ABI43_0_0EXModuleTemplateViewManager ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI43_0_0EXModuleTemplateViewManager

ABI43_0_0EX_EXPORT_MODULE(ExpoModuleTemplateViewManager);

- (UIView *)view
{
  return [[ABI43_0_0EXModuleTemplateView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoModuleTemplateView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSomethingHappened"];
}

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
