//  Copyright © 2020 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXFirebaseCore/EXFirebaseCore.h>
#import <Firebase/Firebase.h>

@interface EXFirebaseCore (FIROptions)

+ (nonnull NSDictionary *)firOptionsToJSON:(nonnull FIROptions *)options;
+ (BOOL)areFirOptions:(nullable FIROptions *)options1 equalTo:(nullable FIROptions *)options2;

@end
