// Copyright 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXNotifications/EXTokenDispatcher.h>
#import <EXNotifications/EXEngine.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXSimpleTokenDispatcher : NSObject <EXTokenDispatcher>

- (instancetype)initWithEngine:(id<EXEngine>)engine;

@end

NS_ASSUME_NONNULL_END
