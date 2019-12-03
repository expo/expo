/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI34_0_0/ABI34_0_0RCTMountingManagerDelegate.h>
#import <ReactABI34_0_0/ABI34_0_0RCTPrimitives.h>
#import <ReactABI34_0_0/core/ReactABI34_0_0Primitives.h>
#import <ReactABI34_0_0/mounting/ShadowView.h>
#import <ReactABI34_0_0/mounting/ShadowViewMutation.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI34_0_0RCTComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface ABI34_0_0RCTMountingManager : NSObject

@property (nonatomic, weak) id<ABI34_0_0RCTMountingManagerDelegate> delegate;
@property (nonatomic, strong) ABI34_0_0RCTComponentViewRegistry *componentViewRegistry;

/**
 * Transfroms mutation insturctions to mount items and execute them.
 * The order of mutation tnstructions matters.
 * Can be called from any thread.
 */
- (void)performTransactionWithMutations:(facebook::ReactABI34_0_0::ShadowViewMutationList)mutations rootTag:(ReactABI34_0_0Tag)rootTag;

/**
 * Suggests preliminary creation of a component view of given type.
 * The receiver is free to ignore the request.
 * Can be called from any thread.
 */
- (void)optimisticallyCreateComponentViewWithComponentHandle:(facebook::ReactABI34_0_0::ComponentHandle)componentHandle;

@end

NS_ASSUME_NONNULL_END
