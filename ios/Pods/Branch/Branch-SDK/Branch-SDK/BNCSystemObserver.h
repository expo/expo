//
//  BNCSystemObserver.h
//  Branch-SDK
//
//  Created by Alex Austin on 6/5/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

@interface BNCSystemObserver : NSObject

+ (NSString *)getUniqueHardwareId:(BOOL *)isReal
                          isDebug:(BOOL)debug
                          andType:(NSString *__autoreleasing*)type;
+ (NSString *)getVendorId;
+ (NSString *)getDefaultUriScheme;
+ (NSString *)getAppVersion;
+ (NSString *)getBundleID;
+ (NSString *)getTeamIdentifier;
+ (NSString *)getBrand;
+ (NSString *)getModel;
+ (NSString *)getOS;
+ (NSString *)getOSVersion;
+ (NSNumber *)getScreenWidth;
+ (NSNumber *)getScreenHeight;
+ (BOOL)isSimulator;
+ (BOOL)adTrackingSafe;
+ (NSString*) getAdId;

@end
