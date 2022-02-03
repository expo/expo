// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXViewManagerAdapter.h>

@interface ABI43_0_0EXViewManagerAdapter ()

- (ABI43_0_0EXViewManager *)viewManager;

@end

@implementation ABI43_0_0EXViewManagerAdapter

- (NSArray<NSString *> *)supportedEvents
{
  return [[self viewManager] supportedEvents];
}

// This class is not used directly --- usually it's subclassed
// in runtime by ABI43_0_0EXNativeModulesProxy for each exported view manager.
// Each created class has different class name, conforming to convention.
// This way we can provide ABI43_0_0React Native with different ABI43_0_0RCTViewManagers
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

ABI43_0_0RCT_CUSTOM_VIEW_PROPERTY(proxiedProperties, NSDictionary, UIView)
{
  __weak ABI43_0_0EXViewManagerAdapter *weakSelf = self;
  [json enumerateKeysAndObjectsUsingBlock:^(id  _Nonnull key, id  _Nonnull obj, BOOL * _Nonnull stop) {
    __strong ABI43_0_0EXViewManagerAdapter *strongSelf = weakSelf;
    [strongSelf.viewManager updateProp:key withValue:obj onView:view];
  }];
}

@end
