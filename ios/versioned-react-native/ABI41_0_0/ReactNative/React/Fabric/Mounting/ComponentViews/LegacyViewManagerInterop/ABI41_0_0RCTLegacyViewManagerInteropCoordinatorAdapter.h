/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI41_0_0React/components/legacyviewmanagerinterop/ABI41_0_0RCTLegacyViewManagerInteropCoordinator.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0RCTLegacyViewManagerInteropCoordinatorAdapter : NSObject

- (instancetype)initWithCoordinator:(ABI41_0_0RCTLegacyViewManagerInteropCoordinator *)coordinator ABI41_0_0ReactTag:(NSInteger)tag;

@property (strong, nonatomic) UIView *paperView;

@property (nonatomic, copy, nullable) void (^eventInterceptor)(std::string eventName, folly::dynamic event);

- (void)setProps:(folly::dynamic const &)props;

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args;

@end

NS_ASSUME_NONNULL_END
