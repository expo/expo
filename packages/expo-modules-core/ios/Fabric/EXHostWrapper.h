// Copyright 2024-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 A wrapper around RCTHost.
 RCTHost isn't directly available in Swift, so this wrapper provides a typed interface.
 */
NS_SWIFT_NAME(ExpoHostWrapper)
@interface EXHostWrapper : NSObject

- (instancetype)initWithHost:(id)host;

- (nullable UIView *)findViewWithTag:(NSInteger)tag;

@end

NS_ASSUME_NONNULL_END
