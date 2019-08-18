// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXSecureStore/EXSecureStore.h>)
#import "EXScopedSecureStore.h"

@interface EXSecureStore (Protected)

- (NSString *)validatedKey:(NSString *)key;

@end

@interface EXScopedSecureStore ()

@property (strong, nonatomic) NSString *experienceId;

@end

@implementation EXScopedSecureStore

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

- (NSString *)validatedKey:(NSString *)key {
  if (![super validatedKey:key]) {
    return nil;
  }

  return [NSString stringWithFormat:@"%@-%@", _experienceId, key];
}

@end
#endif
