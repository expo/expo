// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXNetwork/EXNetworkView.h>
#import <EXNetwork/EXNetworkViewManager.h>

@interface EXNetworkViewManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXNetworkViewManager

EX_EXPORT_MODULE(ExpoNetworkViewManager);

- (UIView *)view
{
  return [[EXNetworkView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoNetworkView";
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
