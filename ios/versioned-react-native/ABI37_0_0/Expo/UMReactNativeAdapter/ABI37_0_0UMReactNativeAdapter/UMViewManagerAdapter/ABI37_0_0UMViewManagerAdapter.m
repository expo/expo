// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMViewManagerAdapter.h>

@interface ABI37_0_0UMViewManagerAdapter ()

@property ABI37_0_0UMViewManager *viewManager;

@end

@implementation ABI37_0_0UMViewManagerAdapter

- (instancetype)initWithViewManager:(ABI37_0_0UMViewManager *)viewManager
{
  if (self = [super init]) {
    _viewManager = viewManager;
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return [_viewManager supportedEvents];
}

// This class is not used directly --- usually it's subclassed
// in runtime by ABI37_0_0UMNativeModulesProxy for each exported view manager.
// Each created class has different class name, conforming to convention.
// This way we can provide ABI37_0_0React Native with different ABI37_0_0RCTViewManagers
// returning different modules names.

+ (NSString *)moduleName
{
  return NSStringFromClass(self);
}

- (UIView *)view
{
  return [_viewManager view];
}

// The adapter multiplexes custom view properties in one "big object prop" that is passed here.

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(proxiedProperties, NSDictionary, UIView)
{
  __weak ABI37_0_0UMViewManagerAdapter *weakSelf = self;
  [json enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
    __strong ABI37_0_0UMViewManagerAdapter *strongSelf = weakSelf;
    [strongSelf.viewManager updateProp:key withValue:obj onView:view];
  }];
}

@end
