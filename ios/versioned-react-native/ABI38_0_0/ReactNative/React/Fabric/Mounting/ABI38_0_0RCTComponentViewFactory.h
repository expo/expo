/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI38_0_0React/ABI38_0_0RCTComponentViewDescriptor.h>
#import <ABI38_0_0React/ABI38_0_0RCTComponentViewProtocol.h>

#import <ABI38_0_0React/uimanager/ComponentDescriptorRegistry.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI38_0_0RCTComponentViewFactoryDelegate <NSObject>

/**
 * Given a component name, return its actual class. If component with doesn't exist, nil is returned.
 * Can be called on any thread.
 */
- (Class<ABI38_0_0RCTComponentViewProtocol>)componentViewClassWithName:(ABI38_0_0facebook::ABI38_0_0React::ComponentName)name;

@end

/**
 * Registry of supported component view classes that can instantiate
 * view component instances by given component handle.
 */
@interface ABI38_0_0RCTComponentViewFactory : NSObject

/**
 * Constructs and returns an instance of the class with a bunch of already registered standard components.
 */
+ (ABI38_0_0RCTComponentViewFactory *)standardComponentViewFactory;

/**
 * Registers a component view class in the factory.
 */
- (void)registerComponentViewClass:(Class<ABI38_0_0RCTComponentViewProtocol>)componentViewClass;

/**
 * Creates a component view with given component handle.
 */
- (ABI38_0_0RCTComponentViewDescriptor)createComponentViewWithComponentHandle:(ABI38_0_0facebook::ABI38_0_0React::ComponentHandle)componentHandle;

/**
 * Creates *managed* `ComponentDescriptorRegistry`. After creation, the object continues to store a weak pointer to the
 * registry and update it accordingly to the changes in the object.
 */
- (ABI38_0_0facebook::ABI38_0_0React::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (ABI38_0_0facebook::ABI38_0_0React::ComponentDescriptorParameters)parameters;

@property (atomic, weak, nullable) id<ABI38_0_0RCTComponentViewFactoryDelegate> delegate;

@end

NS_ASSUME_NONNULL_END
