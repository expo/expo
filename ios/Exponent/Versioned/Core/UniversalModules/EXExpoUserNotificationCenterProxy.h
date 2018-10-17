//  Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXInternalModule.h>
#import <EXPermissionsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXExpoUserNotificationCenterProxy : NSObject <EXInternalModule, EXUserNotificationCenterProxyInterface>

+ (instancetype)sharedInstance;

@end

NS_ASSUME_NONNULL_END
