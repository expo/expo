// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesView.h>
#import <EXUpdates/EXUpdatesViewManager.h>

@interface EXUpdatesViewManager ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXUpdatesViewManager

UM_EXPORT_MODULE(ExpoUpdatesViewManager);

- (UIView *)view
{
  return [[EXUpdatesView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoUpdatesView";
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
