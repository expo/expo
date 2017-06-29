// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXRemoteNotificationManager;

@interface EXKernelServiceRegistry : NSObject

@property (nonatomic, readonly) EXRemoteNotificationManager *remoteNotificationManager;

@property (nonatomic, readonly) NSDictionary *allServices;

@end
