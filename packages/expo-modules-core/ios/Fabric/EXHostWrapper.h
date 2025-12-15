// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>

/**
 A wrapper around RCTHost. RCTHost isn't directly available in Swift.
 */
NS_SWIFT_NAME(ExpoHostWrapper)
@interface EXHostWrapper : NSObject

- (instancetype _Nonnull)initWithHost:(id _Nonnull)host;

- (nullable UIView *)findViewWithTag:(NSInteger)tag;

@end

