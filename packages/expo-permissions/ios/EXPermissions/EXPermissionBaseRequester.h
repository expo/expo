// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXPermissions/EXPermissionRequester.h>

@interface EXPermissionBaseRequester : NSObject<EXPermissionRequester>

@property (nonatomic, weak) id<EXPermissionRequesterDelegate> delegate;

@end
