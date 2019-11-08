// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXScoper.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXMessageUnscoper : NSObject

+ (NSDictionary *)getUnscopedMessage:(NSDictionary *)message scoper:(id<EXScoper>)scoper;

@end

NS_ASSUME_NONNULL_END
