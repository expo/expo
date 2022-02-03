// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXViewManagerAdapter.h>

@interface EXViewManagerAdapter ()

- (EXViewManager *)viewManager;

@end

@implementation EXViewManagerAdapter

- (NSArray<NSString *> *)supportedEvents
{
  return [[self viewManager] supportedEvents];
}

// This class is not used directly --- usually it's subclassed
// in runtime by EXNativeModulesProxy for each exported view manager.
// Each created class has different class name, conforming to convention.
// This way we can provide React Native with different RCTViewManagers
// returning different modules names.

+ (NSString *)moduleName
{
  return NSStringFromClass(self);
}

- (UIView *)view
{
  return [[self viewManager] view];
}

// The adapter multiplexes custom view properties in one "big object prop" that is passed here.

RCT_CUSTOM_VIEW_PROPERTY(proxiedProperties, NSDictionary, UIView)
{
  __weak EXViewManagerAdapter *weakSelf = self;
  [json enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
    __strong EXViewManagerAdapter *strongSelf = weakSelf;
    [strongSelf.viewManager updateProp:key withValue:obj onView:view];
  }];
}

@end
