// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXBrightness/EXBrightnessView.h>
#import <EXBrightness/EXBrightnessViewManager.h>

@interface EXBrightnessViewManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXBrightnessViewManager

EX_EXPORT_MODULE(ExpoBrightnessViewManager);

- (UIView *)view
{
  return [[EXBrightnessView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoBrightnessView";
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
