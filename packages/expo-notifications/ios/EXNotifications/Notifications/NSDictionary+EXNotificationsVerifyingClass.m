#import <EXNotifications/NSDictionary+EXNotificationsVerifyingClass.h>

static NSString * const invalidValueExceptionName = @"Value of invalid class encountered";
static NSString * const invalidValueClassReasonFormat = @"Value under key `%@` is of class %@, while %@ was expected.";

@implementation NSDictionary (EXNotificationsVerifyingClass)

- (id)objectForKey:(id)aKey verifyingClass:(__unsafe_unretained Class)klass
{
  id obj = [self objectForKey:aKey];
  if (!obj || [obj isKindOfClass:klass]) {
    return obj;
  }

  NSString *reason = [NSString stringWithFormat:invalidValueClassReasonFormat, aKey, NSStringFromClass([obj class]), NSStringFromClass(klass)];
  @throw [NSException exceptionWithName:invalidValueExceptionName reason:reason userInfo:nil];
}

@end
