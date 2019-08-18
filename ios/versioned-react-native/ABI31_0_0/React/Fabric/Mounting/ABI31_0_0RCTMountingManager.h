/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI31_0_0fabric/ABI31_0_0uimanager/TreeMutationInstruction.h>
#import <ReactABI31_0_0/ABI31_0_0RCTPrimitives.h>
#import <ReactABI31_0_0/ABI31_0_0RCTMountingManagerDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI31_0_0RCTComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface ABI31_0_0RCTMountingManager : NSObject

@property (nonatomic, weak) id <ABI31_0_0RCTMountingManagerDelegate> delegate;
@property (nonatomic, strong) ABI31_0_0RCTComponentViewRegistry *componentViewRegistry;

/**
 * Transfroms mutation insturctions to mount items and execute them.
 * The order of mutation tnstructions matters.
 * Can be called from any thread.
 */
- (void)mutateComponentViewTreeWithMutationInstructions:(facebook::ReactABI31_0_0::TreeMutationInstructionList)instructions
                                                rootTag:(ReactABI31_0_0Tag)rootTag;

/**
 * Suggests preliminary creation of a component view of given type.
 * The receiver is free to ignore the request.
 * Can be called from any thread.
 */
- (void)preliminaryCreateComponentViewWithName:(NSString *)componentName;

@end

NS_ASSUME_NONNULL_END
