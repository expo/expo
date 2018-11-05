/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI29_0_0/ABI29_0_0RCTComponent.h>
#import <ReactABI29_0_0/ABI29_0_0RCTDefines.h>
#import <ReactABI29_0_0/ABI29_0_0RCTViewManager.h>

@class ABI29_0_0RCTBridge;
@class ABI29_0_0RCTShadowView;
@class UIView;

@interface ABI29_0_0RCTComponentData : NSObject

@property (nonatomic, readonly) Class managerClass;
@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, weak, readonly) ABI29_0_0RCTViewManager *manager;

- (instancetype)initWithManagerClass:(Class)managerClass
                              bridge:(ABI29_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (UIView *)createViewWithTag:(NSNumber *)tag;
- (ABI29_0_0RCTShadowView *)createShadowViewWithTag:(NSNumber *)tag;
- (void)setProps:(NSDictionary<NSString *, id> *)props forView:(id<ABI29_0_0RCTComponent>)view;
- (void)setProps:(NSDictionary<NSString *, id> *)props forShadowView:(ABI29_0_0RCTShadowView *)shadowView;

- (NSDictionary<NSString *, id> *)viewConfig;

@end
