// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXOta/EXOtaView.h>
#import <EXOta/EXOtaViewManager.h>

@interface EXOtaViewManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXOtaViewManager

EX_EXPORT_MODULE(ExpoOtaViewManager);

- (UIView *)view
{
  return [[EXOtaView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoOtaView";
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
