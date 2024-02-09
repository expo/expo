// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Swift.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Internal `EXReactDelegateWrapper` interface for the designated initializer with `ExpoReactDelegate`.
 Since `ExpoReactDelegate` implements in swift and requires the generated `ExpoModulesCore-Swift.h` header,
 this header file should ONLY be imported from *.m or *.mm files.
 */
@interface EXReactDelegateWrapper(Private)

- (instancetype)initWithExpoReactDelegate:(EXReactDelegate *)expoReactDelegate;

@end

NS_ASSUME_NONNULL_END
