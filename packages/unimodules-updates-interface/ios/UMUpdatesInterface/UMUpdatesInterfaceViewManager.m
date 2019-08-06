// Copyright 2016-present 650 Industries. All rights reserved.

#import <UMUpdatesInterface/UMUpdatesInterfaceView.h>
#import <UMUpdatesInterface/UMUpdatesInterfaceViewManager.h>

@interface UMUpdatesInterfaceViewManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation UMUpdatesInterfaceViewManager

EX_EXPORT_MODULE(UnimodulesUpdatesInterfaceViewManager);

- (UIView *)view
{
  return [[UMUpdatesInterfaceView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"UnimodulesUpdatesInterfaceView";
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
