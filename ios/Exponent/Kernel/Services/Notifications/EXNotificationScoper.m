//  Copyright © 2018-present 650 Industries. All rights reserved

#import "EXNotificationScoper.h"

@implementation EXNotificationScoper

static NSString *const Delimiter = @":";

+(NSArray *)split:(NSString*)string {
  return [string componentsSeparatedByString:Delimiter];
}
+(NSString *)scope:(NSString *)identifier withExperienceId:(NSString*) experienceId {
  return [NSString stringWithFormat:@"%@%@%@", experienceId, Delimiter, identifier];
}

@end
