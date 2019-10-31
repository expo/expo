// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXNotifications/EXBareScoper.h>
#import <UMCore/UMDefines.h>

@interface EXBareScoper ()

@end

@implementation EXBareScoper

UM_REGISTER_MODULE()

- (NSString *)getScopedString:(NSString *)string {
  return string;
}

- (NSString *)getUnscopedString:(NSString *)string {
  NSArray<NSString*> *parts = [string componentsSeparatedByString:@":"];
  if ([parts count] > 1) {
    return parts[1];
  }
  return string;
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(EXScoper)];
}

@end
