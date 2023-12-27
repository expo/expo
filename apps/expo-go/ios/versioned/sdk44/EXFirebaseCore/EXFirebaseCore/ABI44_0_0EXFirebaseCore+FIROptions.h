//  Copyright © 2020 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI44_0_0EXFirebaseCore/ABI44_0_0EXFirebaseCore.h>
#import <Firebase/Firebase.h>

@interface ABI44_0_0EXFirebaseCore (FIROptions)

+ (nonnull NSDictionary *)firOptionsToJSON:(nonnull FIROptions *)options;
+ (BOOL)areFirOptions:(nullable FIROptions *)options1 equalTo:(nullable FIROptions *)options2;

@end
