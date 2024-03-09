// Copyright 2015-present 650 Industries. All rights reserved.

#pragma once

NS_ASSUME_NONNULL_BEGIN

/**
 An abstract classic/new architecture independent wrapper for RCTBridge or RCTHost.
 We reference this class especially from Swift since RCTHost is not available from Swift.
 */
NS_SWIFT_NAME(ExpoReactHostWrapper)
@interface EXReactHostWrapper : NSObject

- (id)get;

@end

NS_ASSUME_NONNULL_END
