//  Copyright © 2020 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXFirebaseCore/EXFirebaseCore.h>
#import <Firebase/Firebase.h>

@interface EXFirebaseCore (FIROptions)

+ (nonnull NSDictionary *)firOptionsToJSON:(nonnull FIROptions *)options;
+ (nullable FIROptions *)firOptionsWithJSON:(nullable NSDictionary *)json;
+ (BOOL) firOptionsIsEqualTo:(nullable FIROptions*)firebaseOptions compareTo:(nullable FIROptions*)compareTo;

@end
