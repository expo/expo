/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI17_0_0/ABI17_0_0RCTComponent.h>
#import <ReactABI17_0_0/ABI17_0_0RCTDefines.h>
#import <ReactABI17_0_0/ABI17_0_0RCTViewManager.h>

@class ABI17_0_0RCTBridge;
@class ABI17_0_0RCTShadowView;
@class UIView;

@interface ABI17_0_0RCTComponentData : NSObject

@property (nonatomic, readonly) Class managerClass;
@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, weak, readonly) ABI17_0_0RCTViewManager *manager;

- (instancetype)initWithManagerClass:(Class)managerClass
                              bridge:(ABI17_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (UIView *)createViewWithTag:(NSNumber *)tag;
- (ABI17_0_0RCTShadowView *)createShadowViewWithTag:(NSNumber *)tag;
- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(id<ABI17_0_0RCTComponent>)view;
- (void)setProps:(NSDictionary<NSString *, id> *)props forShadowView:(ABI17_0_0RCTShadowView *)shadowView;

- (NSDictionary<NSString *, id> *)viewConfig;

- (ABI17_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(NSDictionary<NSNumber *, ABI17_0_0RCTShadowView *> *)registry;

@end
