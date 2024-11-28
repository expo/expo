// Copyright 2021-present 650 Industries. All rights reserved.

#import <React/React-Core-umbrella.h>

typedef void (^RCTPropBlockAlias)(id<RCTComponent> _Nonnull view, id _Nullable json);

@interface RCTComponentData (Privates)

- (nonnull RCTPropBlockAlias)createPropBlock:(nonnull NSString *)name isShadowView:(BOOL)isShadowView;

@end

/**
 This is a compatible adapter for Swift `ComponentData` to access react-native's `RCTComponentData`.
 When running in react-native new architecture mode, the `eventDispatcher` is actually null.
 however the`RCTComponentData` still expects it's nonnull because of the `NS_ASSUME_NONNULL_BEGIN`
 https://github.com/facebook/react-native/blob/ea4724b37c9f78bd33daab547d6cc4f8b7f7dd81/packages/react-native/React/Views/RCTComponentData.h#L19-L35.
 Swift will have a runtime exception from the implicitly unwrapping.
 This compatible adapter basically allows the `eventDispatcher` to be nullable.
 TODO: We should propose the fix to upstream and remove this adapter when dropping SDK 49.
 */
@interface RCTComponentDataSwiftAdapter : RCTComponentData

- (nonnull instancetype)initWithManagerClass:(nonnull Class)managerClass
                                      bridge:(nonnull RCTBridge *)bridge
                             eventDispatcher:(nullable id<RCTEventDispatcherProtocol>)eventDispatcher;

@end
