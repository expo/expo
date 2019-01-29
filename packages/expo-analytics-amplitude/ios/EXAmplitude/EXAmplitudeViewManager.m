// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXAmplitude/EXAmplitudeView.h>
#import <EXAmplitude/EXAmplitudeViewManager.h>

@interface EXAmplitudeViewManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXAmplitudeViewManager

EX_EXPORT_MODULE(ExpoAmplitudeViewManager);

- (UIView *)view
{
  return [[EXAmplitudeView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoAmplitudeView";
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
