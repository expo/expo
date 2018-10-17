//  Copyright © 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXNotificationScoper : NSObject

+(NSArray *)split:(NSString *)string;
+(NSString *)scope:(NSString *)identifier withExperienceId:(NSString*) experienceId;

@end

NS_ASSUME_NONNULL_END
