// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXEngine.h>
#import <EXNotifications/EXTokenDispatcher.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSimpleTokenDispatcher : NSObject <EXTokenDispatcher>

- (instancetype)initWithEngine:(id<EXEngine>)engine;

@end

NS_ASSUME_NONNULL_END
