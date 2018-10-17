// Copyright 2018-present 650 Industries. All rights reserved.
#import <Foundation/Foundation.h>

#import <UserNotifications/UserNotifications.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXCategoryAction : NSObject

@property (strong, nonatomic) NSString *actionId;
@property (strong, nonatomic) NSString *actionName;
@property (assign, nonatomic) int flags;
- (UNNotificationAction *) getUNNotificationAction;
+ (instancetype)parseFromParams:(NSDictionary *) params;

@end

@interface EXCategoryActionWithTextInput : EXCategoryAction

@property (strong, nonatomic) NSString *placeholderText;
@property (strong, nonatomic) NSString *buttonName;

@end

NS_ASSUME_NONNULL_END
