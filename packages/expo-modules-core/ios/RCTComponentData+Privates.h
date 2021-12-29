// Copyright 2021-present 650 Industries. All rights reserved.

#import <React/RCTComponent.h>
#import <React/RCTComponentData.h>

typedef void (^RCTPropBlockAlias)(id<RCTComponent> _Nonnull view, id _Nullable json);

@interface RCTComponentData (Privates)

- (nonnull RCTPropBlockAlias)createPropBlock:(nonnull NSString *)name isShadowView:(BOOL)isShadowView;

@end
