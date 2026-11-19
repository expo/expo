// Copyright 2026-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ExpoModulesCore/EXViewPropsDecoding.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Test double owning a real `expo::views::NewComponentDescriptor` whose decoder is an
 `expo::views::ObjCPropsDecoder` around the given decoder. Lets Swift tests run props through
 `cloneProps` and the bridge into a Swift `ViewPropsDecoder`, the way Fabric does. Each update clones
 the current props and makes the result current.
 */
@interface EXTestNewComponentDescriptor : NSObject

- (instancetype)initWithDecoder:(id<EXViewPropsDecoding>)decoder;

- (instancetype)init NS_UNAVAILABLE;

/**
 Clones the current props with a JavaScript props object, given as a `facebook::jsi::Runtime *` and a
 pointer to the `facebook::jsi::Value`, and returns the decoded props of the result.
 */
- (nullable id)updateWithRuntime:(void *)runtime props:(const void *)props NS_SWIFT_NAME(update(runtime:props:));

/**
 Clones the current props with props as `folly::dynamic`, built from a dictionary of strings and
 numbers, and returns the decoded props of the result.
 */
- (nullable id)updateWithDynamicProps:(NSDictionary<NSString *, id> *)props NS_SWIFT_NAME(update(dynamicProps:));

/**
 Drops the current props, as Fabric does when the view's shadow node goes away.
 */
- (void)reset;

/**
 The `opacity` of the current props, one of the base view props that React Native parses.
 */
@property (nonatomic, readonly) float opacity;

@end

NS_ASSUME_NONNULL_END
