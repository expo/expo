/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI27_0_0/ABI27_0_0RCTComponent.h>
#import <ReactABI27_0_0/ABI27_0_0RCTDefines.h>
#import <ReactABI27_0_0/ABI27_0_0RCTViewManager.h>

@class ABI27_0_0RCTBridge;
@class ABI27_0_0RCTShadowView;
@class UIView;

@interface ABI27_0_0RCTComponentData : NSObject

@property (nonatomic, readonly) Class managerClass;
@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, weak, readonly) ABI27_0_0RCTViewManager *manager;

- (instancetype)initWithManagerClass:(Class)managerClass
                              bridge:(ABI27_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (UIView *)createViewWithTag:(NSNumber *)tag;
- (ABI27_0_0RCTShadowView *)createShadowViewWithTag:(NSNumber *)tag;
- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(id<ABI27_0_0RCTComponent>)view;
- (void)setProps:(NSDictionary<NSString *, id> *)props forShadowView:(ABI27_0_0RCTShadowView *)shadowView;

- (NSDictionary<NSString *, id> *)viewConfig;

@end
