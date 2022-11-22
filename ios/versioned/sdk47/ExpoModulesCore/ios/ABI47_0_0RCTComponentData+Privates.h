// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI47_0_0React/ABI47_0_0RCTComponent.h>
#import <ABI47_0_0React/ABI47_0_0RCTComponentData.h>

typedef void (^ABI47_0_0RCTPropBlockAlias)(id<ABI47_0_0RCTComponent> _Nonnull view, id _Nullable json);

@interface ABI47_0_0RCTComponentData (Privates)

- (nonnull ABI47_0_0RCTPropBlockAlias)createPropBlock:(nonnull NSString *)name isShadowView:(BOOL)isShadowView;

@end
