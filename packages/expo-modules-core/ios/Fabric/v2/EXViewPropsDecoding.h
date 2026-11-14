// Copyright 2026-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Decodes the props of one view type for `expo::views::ObjCPropsDecoder`. Swift implements it with
 `ViewPropsDecoderAdapter`, so the C++ component descriptor reaches the Swift decoder without C++ interop.
 Fabric calls it from the JavaScript thread and from the main thread, so it must be thread-safe.
 */
NS_SWIFT_NAME(ViewPropsDecoding)
@protocol EXViewPropsDecoding <NSObject>

/**
 Decodes the JavaScript props object at `props`, a `facebook::jsi::Value` of the `facebook::jsi::Runtime`
 at `runtime`, into a copy of `previous`. Returns the decoded props, or `previous` when no prop changed.
 `nil` also keeps `previous`.
 */
- (nullable id)decodeProps:(const void *)props runtime:(const void *)runtime previous:(nullable id)previous
    NS_SWIFT_NAME(decode(propsPointer:runtimePointer:previous:));

/**
 The names of the view's props, in the order that `decodeValues:indexes:count:runtime:previous:` indexes
 them.
 */
@property (nonatomic, readonly) NSArray<NSString *> *propNames;

/**
 Decodes `count` values of the view's props into a copy of `previous`. `values[i]` points to a
 `facebook::jsi::Value` of the `facebook::jsi::Runtime` at `runtime`, and `indexes[i]` is the index of its
 prop name in `propNames`. Returns the decoded props, or `previous` when no prop changed. `nil` also keeps
 `previous`.
 */
- (nullable id)decodeValues:(const void *const _Nonnull *)values
                    indexes:(const NSInteger *)indexes
                      count:(NSInteger)count
                    runtime:(const void *)runtime
                   previous:(nullable id)previous
    NS_SWIFT_NAME(decode(valuePointers:indexes:count:runtimePointer:previous:));

/**
 Reports props that came without a runtime and weren't decoded.
 */
- (void)didSkipProps:(NSArray<NSString *> *)propNames;

@end

NS_ASSUME_NONNULL_END
