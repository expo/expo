//  Copyright © 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXSendNotificationParams : NSObject
@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, strong) NSDictionary *body;
@property (nonatomic, strong) NSNumber *isRemote;
@property (nonatomic, strong) NSNumber *isFromBackground;
@property (nonatomic, strong) NSString *actionId;
@property (nonatomic, strong) NSString *userText;
- (instancetype)initWithExperienceId:(NSString *)experienceId
                    notificationBody:(NSDictionary *)body
                            isRemote:(NSNumber *)isRemote
                    isFromBackground:(NSNumber *)isFromBackground
                            actionId:(NSString *)actionId
                            userText:(NSString *)userText;
@end
