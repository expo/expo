/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI37_0_0React/ABI37_0_0RCTComponent.h>
#import <ABI37_0_0React/ABI37_0_0RCTDefines.h>
#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>

@class ABI37_0_0RCTBridge;
@class ABI37_0_0RCTShadowView;
@class UIView;

@interface ABI37_0_0RCTComponentData : NSObject

@property (nonatomic, readonly) Class managerClass;
@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, weak, readonly) ABI37_0_0RCTViewManager *manager;

- (instancetype)initWithManagerClass:(Class)managerClass
                              bridge:(ABI37_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (UIView *)createViewWithTag:(NSNumber *)tag;
- (ABI37_0_0RCTShadowView *)createShadowViewWithTag:(NSNumber *)tag;
- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(id<ABI37_0_0RCTComponent>)view;
- (void)setProps:(NSDictionary<NSString *, id> *)props forShadowView:(ABI37_0_0RCTShadowView *)shadowView;

- (NSDictionary<NSString *, id> *)viewConfig;

@end
