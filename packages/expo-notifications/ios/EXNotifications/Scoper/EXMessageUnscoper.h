// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXNotifications/EXScoper.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXMessageUnscoper : NSObject

+ (NSDictionary *) getUnscopedMessage:(NSDictionary *)message  scoper:(id<EXScoper>)scoper;

@end

NS_ASSUME_NONNULL_END
