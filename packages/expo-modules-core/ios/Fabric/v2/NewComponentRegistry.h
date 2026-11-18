// Copyright 2026-present 650 Industries. All rights reserved.

#pragma once

#if defined(__cplusplus) && defined(__OBJC__)

#import <Foundation/Foundation.h>

#include <react/renderer/componentregistry/ComponentDescriptorProvider.h>

namespace expo::views {

/**
 Returns the provider of the component that `+[ExpoNativeViewObjC registerComponentViewClass:propsDecoder:]`
 registered for the given class, found by the class name. A class that wasn't registered gets a component that decodes
 no props. The component views of UIKit and SwiftUI views of Expo Modules v2 share this registry.
 */
facebook::react::ComponentDescriptorProvider componentDescriptorProvider(Class viewClass);

} // namespace expo::views

#endif
