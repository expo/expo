// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTInspectorPackagerConnection;

@interface EXVersionedNetworkInterceptor : NSObject

- (instancetype)initWithRCTInspectorPackagerConnection:(RCTInspectorPackagerConnection *)inspectorPackgerConnection;

@end

NS_ASSUME_NONNULL_END
