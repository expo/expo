// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/Swift.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Internal `ABI49_0_0EXReactDelegateWrapper` interface for the designated initializer with `ExpoReactDelegate`.
 Since `ExpoReactDelegate` implements in swift and requires the generated `ExpoModulesCore-Swift.h` header,
 this header file should ONLY be imported from *.m or *.mm files.
 */
@interface ABI49_0_0EXReactDelegateWrapper(Private)

- (instancetype)initWithExpoReactDelegate:(ExpoReactDelegate *)expoReactDelegate;

@end

NS_ASSUME_NONNULL_END
