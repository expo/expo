/*
 * Copyright 2018 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
#import <Foundation/Foundation.h>

#import "FIRComponentType.h"
#import "FIRLibrary.h"

NS_ASSUME_NONNULL_BEGIN

/// A type-safe macro to retrieve a component from a container. This should be used to retrieve
/// components instead of using the container directly.
#define FIR_COMPONENT(type, container) \
  [FIRComponentType<id<type>> instanceForProtocol:@protocol(type) inContainer:container]

@class FIRApp;

/// A container that holds different components that are registered via the
/// `registerAsComponentRegistrant:` call. These classes should conform to `FIRComponentRegistrant`
/// in order to properly register components for Core.
NS_SWIFT_NAME(FirebaseComponentContainer)
@interface FIRComponentContainer : NSObject

/// A weak reference to the app that an instance of the container belongs to.
@property(nonatomic, weak, readonly) FIRApp *app;

/// Unavailable. Use the `container` property on `FIRApp`.
- (instancetype)init NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
