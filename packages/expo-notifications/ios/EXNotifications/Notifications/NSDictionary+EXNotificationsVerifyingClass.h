#import <Foundation/Foundation.h>

@interface NSDictionary (EXNotificationsVerifyingClass)

- (id)objectForKey:(id)aKey verifyingClass:(__unsafe_unretained Class)klass;

@end
