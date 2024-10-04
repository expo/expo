// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXAppAuth/ABI43_0_0EXAppAuth.h>
#import <AppAuth/AppAuth.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXAppAuth (JSON)

+ (NSString *)dateNativeToJSON:(NSDate *)input;

+ (NSDictionary *)tokenResponseNativeToJSON:(OIDTokenResponse *)input;

@end

NS_ASSUME_NONNULL_END
