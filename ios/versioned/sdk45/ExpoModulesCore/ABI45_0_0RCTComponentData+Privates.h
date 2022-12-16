// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI45_0_0React/ABI45_0_0RCTComponent.h>
#import <ABI45_0_0React/ABI45_0_0RCTComponentData.h>

typedef void (^ABI45_0_0RCTPropBlockAlias)(id<ABI45_0_0RCTComponent> _Nonnull view, id _Nullable json);

@interface ABI45_0_0RCTComponentData (Privates)

- (nonnull ABI45_0_0RCTPropBlockAlias)createPropBlock:(nonnull NSString *)name isShadowView:(BOOL)isShadowView;

@end
