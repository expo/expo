/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI32_0_0/ABI32_0_0RCTMountItemProtocol.h>
#import <ReactABI32_0_0/ABI32_0_0RCTPrimitives.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI32_0_0RCTComponentViewRegistry;

/**
 * Creates a ready-to-mount component view.
 */
@interface ABI32_0_0RCTCreateMountItem : NSObject <ABI32_0_0RCTMountItemProtocol>

- (instancetype)initWithComponentName:(NSString *)componentName
                                  tag:(ReactABI32_0_0Tag)tag;

@end

NS_ASSUME_NONNULL_END
