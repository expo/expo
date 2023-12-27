/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/legacyviewmanagerinterop/ABI43_0_0RCTLegacyViewManagerInteropCoordinator.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0RCTLegacyViewManagerInteropCoordinatorAdapter : NSObject

- (instancetype)initWithCoordinator:(ABI43_0_0RCTLegacyViewManagerInteropCoordinator *)coordinator ABI43_0_0ReactTag:(NSInteger)tag;

@property (strong, nonatomic) UIView *paperView;

@property (nonatomic, copy, nullable) void (^eventInterceptor)(std::string eventName, folly::dynamic event);

- (void)setProps:(folly::dynamic const &)props;

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args;

@end

NS_ASSUME_NONNULL_END
