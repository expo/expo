// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXAppIdProvider.h>
#import <Foundation/Foundation.h>
#import <UMCore/UMInternalModule.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXBareAppIdProvider : NSObject <EXAppIdProvider, UMInternalModule>

+ (NSString *)defaultId;

@end

NS_ASSUME_NONNULL_END
