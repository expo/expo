/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTComponentViewDescriptor.h>
#import <ABI48_0_0React/ABI48_0_0RCTComponentViewProtocol.h>
#import <ABI48_0_0jsi/ABI48_0_0jsi.h>
#import <ABI48_0_0React/ABI48_0_0renderer/componentregistry/ComponentDescriptorRegistry.h>

NS_ASSUME_NONNULL_BEGIN

void ABI48_0_0RCTInstallNativeComponentRegistryBinding(ABI48_0_0facebook::jsi::Runtime &runtime);

/**
 * Registry of supported component view classes that can instantiate
 * view component instances by given component handle.
 */
@interface ABI48_0_0RCTComponentViewFactory : NSObject

/**
 * Constructs and returns an instance of the class with a bunch of already registered standard components.
 */
+ (ABI48_0_0RCTComponentViewFactory *)currentComponentViewFactory;

/**
 * Registers a component view class in the factory.
 */
- (void)registerComponentViewClass:(Class<ABI48_0_0RCTComponentViewProtocol>)componentViewClass;

/**
 * Registers component if there is a matching class. Returns true if it matching class is found or the component has
 * already been registered, false otherwise.
 */
- (BOOL)registerComponentIfPossible:(std::string const &)componentName;

/**
 * Creates a component view with given component handle.
 */
- (ABI48_0_0RCTComponentViewDescriptor)createComponentViewWithComponentHandle:(ABI48_0_0facebook::ABI48_0_0React::ComponentHandle)componentHandle;

/**
 * Creates *managed* `ComponentDescriptorRegistry`. After creation, the object continues to store a weak pointer to the
 * registry and update it accordingly to the changes in the object.
 */
- (ABI48_0_0facebook::ABI48_0_0React::ComponentDescriptorRegistry::Shared)createComponentDescriptorRegistryWithParameters:
    (ABI48_0_0facebook::ABI48_0_0React::ComponentDescriptorParameters)parameters;

@end

NS_ASSUME_NONNULL_END
