// Copyright 2019-present 650 Industries. All rights reserved.

#ifndef EXPushEngineProvider_h
#define EXPushEngineProvider_h

#import <EXNotifications/EXEngine.h>

@protocol EXPushEngineProvider <NSObject>

+ (id<EXEngine>)getEngine;

@end

#endif /* EXPushEngineProvider_h */
