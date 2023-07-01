// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI49_0_0React/ABI49_0_0RCTComponent.h>
#import <ABI49_0_0React/ABI49_0_0RCTComponentData.h>

typedef void (^ABI49_0_0RCTPropBlockAlias)(id<ABI49_0_0RCTComponent> _Nonnull view, id _Nullable json);

@interface ABI49_0_0RCTComponentData (Privates)

- (nonnull ABI49_0_0RCTPropBlockAlias)createPropBlock:(nonnull NSString *)name isShadowView:(BOOL)isShadowView;

@end

/**
 This is a compatible adapter for Swift `ComponentData` to access react-native's `ABI49_0_0RCTComponentData`.
 When running in react-native new architecture mode, the `eventDispatcher` is actually null.
 however the`ABI49_0_0RCTComponentData` still expects it's nonnull because of the `NS_ASSUME_NONNULL_BEGIN`
 https://github.com/facebook/react-native/blob/ea4724b37c9f78bd33daab547d6cc4f8b7f7dd81/packages/react-native/ABI49_0_0React/Views/ABI49_0_0RCTComponentData.h#L19-L35.
 Swift will have a runtime exception from the implicitly unwrapping.
 This compatible adapter basically allows the `eventDispatcher` to be nullable.
 TODO: We should propose the fix to upstream and remove this adapter when dropping SDK 49.
 */
@interface ABI49_0_0RCTComponentDataSwiftAdapter : ABI49_0_0RCTComponentData

- (nonnull instancetype)initWithManagerClass:(nonnull Class)managerClass
                                      bridge:(nonnull ABI49_0_0RCTBridge *)bridge
                             eventDispatcher:(nullable id<ABI49_0_0RCTEventDispatcherProtocol>)eventDispatcher;

@end
