// Copyright 2020-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXFirebaseAnalytics/EXFirebaseAnalytics.h>
#import <Firebase/Firebase.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXFirebaseAnalytics (JSON)

+ (NSDictionary *)firOptionsNativeToJSON:(FIROptions * _Nonnull)input;

+ (nullable FIROptions *)firOptionsJSONToNative:(nullable NSDictionary *)input;

@end

NS_ASSUME_NONNULL_END
