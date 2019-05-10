// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXInAppPurchases/EXInAppPurchasesView.h>
#import <EXInAppPurchases/EXInAppPurchasesViewManager.h>

@interface EXInAppPurchasesViewManager ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXInAppPurchasesViewManager

EX_EXPORT_MODULE(ExpoInAppPurchasesViewManager);

- (UIView *)view
{
  return [[EXInAppPurchasesView alloc] initWithModuleRegistry:_moduleRegistry];
}

- (NSString *)viewName
{
  return @"ExpoInAppPurchasesView";
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
