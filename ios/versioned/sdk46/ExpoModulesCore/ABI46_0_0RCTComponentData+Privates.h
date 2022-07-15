// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI46_0_0React/ABI46_0_0RCTComponent.h>
#import <ABI46_0_0React/ABI46_0_0RCTComponentData.h>

typedef void (^ABI46_0_0RCTPropBlockAlias)(id<ABI46_0_0RCTComponent> _Nonnull view, id _Nullable json);

@interface ABI46_0_0RCTComponentData (Privates)

- (nonnull ABI46_0_0RCTPropBlockAlias)createPropBlock:(nonnull NSString *)name isShadowView:(BOOL)isShadowView;

@end
