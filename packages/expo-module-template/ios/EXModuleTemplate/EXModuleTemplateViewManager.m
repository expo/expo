// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXModuleTemplate/EXModuleTemplateView.h>
#import <EXModuleTemplate/EXModuleTemplateViewManager.h>

@interface EXModuleTemplateViewManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXModuleTemplateViewManager

EX_EXPORT_MODULE(ExpoModuleTemplateViewManager);

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

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

@end
