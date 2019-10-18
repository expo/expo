// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXNotifications/EXTokenDispatcher.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXThreadSafeTokenDispatcher : NSObject <EXTokenDispatcher>

+ (id<EXTokenDispatcher>)sharedInstance;

@end

NS_ASSUME_NONNULL_END
