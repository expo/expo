// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXTokenDispatcher.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXThreadSafeTokenDispatcher : NSObject <EXTokenDispatcher>

+ (id<EXTokenDispatcher>)sharedInstance;

@end

NS_ASSUME_NONNULL_END
