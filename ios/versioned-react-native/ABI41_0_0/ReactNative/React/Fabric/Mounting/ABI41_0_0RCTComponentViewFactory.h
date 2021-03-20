/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTComponentViewDescriptor.h>
#import <ABI41_0_0React/ABI41_0_0RCTComponentViewProtocol.h>

#import <ABI41_0_0React/uimanager/ComponentDescriptorRegistry.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Registry of supported component view classes that can instantiate
 * view component instances by given component handle.
 */
@interface ABI41_0_0RCTComponentViewFactory : NSObject

/**
 * Constructs and returns an instance of the class with a bunch of already registered standard components.
 */
+ (ABI41_0_0RCTComponentViewFactory *)standardComponentViewFactory;

/**
 * Registers a component view class in the factory.
 */
- (void)registerComponentViewClass:(Class<ABI41_0_0RCTComponentViewProtocol>)componentViewClass;

/**
 * Creates a component view with given component handle.
 */
- (ABI41_0_0RCTComponentViewDescriptor)createComponentViewWithComponentHandle:(ABI41_0_0facebook::ABI41_0_0React::ComponentHandle)componentHandle;

/**
 * Creates *managed* `ComponentDescriptorRegistry`. After creation, the object continues to store a weak pointer to the
 * registry and update it accordingly to the changes in the object.
 */
- (ABI41_0_0facebook::ABI41_0_0React::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (ABI41_0_0facebook::ABI41_0_0React::ComponentDescriptorParameters)parameters;

@end

NS_ASSUME_NONNULL_END
