// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXModuleTemplate/EXModuleTemplateView.h>
#import <EXModuleTemplate/EXModuleTemplateViewManager.h>

@interface EXModuleTemplateViewManager ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXModuleTemplateViewManager

UM_EXPORT_MODULE((UmViewManager *)ExpoModuleTemplateViewManager);

- (UIView *)view
{
  return [[EXModuleTemplateView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoModuleTemplateView";
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"onSomethingHappened"];
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
