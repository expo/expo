/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI13_0_0/ABI13_0_0RCTComponent.h>
#import <ReactABI13_0_0/ABI13_0_0RCTDefines.h>
#import <ReactABI13_0_0/ABI13_0_0RCTViewManager.h>

@class ABI13_0_0RCTBridge;
@class ABI13_0_0RCTShadowView;
@class UIView;

@interface ABI13_0_0RCTComponentData : NSObject

@property (nonatomic, readonly) Class managerClass;
@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, weak, readonly) ABI13_0_0RCTViewManager *manager;

- (instancetype)initWithManagerClass:(Class)managerClass
                              bridge:(ABI13_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (UIView *)createViewWithTag:(NSNumber *)tag;
- (ABI13_0_0RCTShadowView *)createShadowViewWithTag:(NSNumber *)tag;
- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(id<ABI13_0_0RCTComponent>)view;
- (void)setProps:(NSDictionary<NSString *, id> *)props forShadowView:(ABI13_0_0RCTShadowView *)shadowView;

- (NSDictionary<NSString *, id> *)viewConfig;

- (ABI13_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI13_0_0RCTShadowView *> *)registry;

@end
