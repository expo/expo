/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridgeModuleDecorator.h>
#import <UIKit/UIKit.h>
#include <folly/dynamic.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI47_0_0RCTComponentData;
@class ABI47_0_0RCTBridge;

typedef void (^InterceptorBlock)(std::string eventName, folly::dynamic event);

@interface ABI47_0_0RCTLegacyViewManagerInteropCoordinator : NSObject

- (instancetype)initWithComponentData:(ABI47_0_0RCTComponentData *)componentData
                               bridge:(ABI47_0_0RCTBridge *)bridge
                bridgelessInteropData:(ABI47_0_0RCTBridgeModuleDecorator *)bridgelessInteropData;

- (UIView *)createPaperViewWithTag:(NSInteger)tag;

- (void)addObserveForTag:(NSInteger)tag usingBlock:(InterceptorBlock)block;

- (void)removeObserveForTag:(NSInteger)tag;

- (void)setProps:(folly::dynamic const &)props forView:(UIView *)view;

- (NSString *)componentViewName;

- (void)handleCommand:(NSString *)commandName args:(NSArray *)args ABI47_0_0ReactTag:(NSInteger)tag;

@end

NS_ASSUME_NONNULL_END
