// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXExportedModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXViewManager : ABI45_0_0EXExportedModule

- (UIView *)view;
- (NSString *)viewName;
- (NSArray<NSString *> *)supportedEvents;

- (NSDictionary<NSString *, NSString *> *)getPropsNames;
- (void)updateProp:(NSString *)propName withValue:(id)value onView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
