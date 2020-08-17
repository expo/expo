//
//  BNCCrashlyticsReportingHelper.m
//  Branch.framework
//
//  Created by Jimmy Dee on 7/18/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import "BNCCrashlyticsWrapper.h"

@interface BNCCrashlyticsWrapper()
@property (nonatomic, nullable) id crashlytics;
@end

@implementation BNCCrashlyticsWrapper

+ (id)sharedInstance
{
    // This just exists so that sharedInstance is not an unknown selector.
    return nil;
}

+ (instancetype)wrapper
{
    return [[self alloc] init];
}

- (instancetype)init
{
    self = [super init];
    if (self) {
        // Dynamically obtain Crashlytics.sharedInstance if the Crashlytics SDK is linked.
        Class Crashlytics = NSClassFromString(@"Crashlytics");
        if ([Crashlytics respondsToSelector:@selector(sharedInstance)]) {
            id crashlyticsInstance = [Crashlytics sharedInstance];
            if ([crashlyticsInstance isKindOfClass:Crashlytics] &&
                [crashlyticsInstance respondsToSelector:@selector(setObjectValue:forKey:)] &&
                [crashlyticsInstance respondsToSelector:@selector(setBoolValue:forKey:)] &&
                [crashlyticsInstance respondsToSelector:@selector(setFloatValue:forKey:)] &&
                [crashlyticsInstance respondsToSelector:@selector(setIntValue:forKey:)])
                _crashlytics = crashlyticsInstance;
        }
    }
    return self;
}

- (void)setObjectValue:(id)value forKey:(NSString *)key
{
    if (!self.crashlytics) return;
    [self.crashlytics setObjectValue:value forKey:key];
}

- (void)setIntValue:(int)value forKey:(NSString *)key
{
    if (!self.crashlytics) return;
    [self.crashlytics setIntValue:value forKey:key];
}

- (void)setFloatValue:(float)value forKey:(NSString *)key
{
    if (!self.crashlytics) return;
    [self.crashlytics setFloatValue:value forKey:key];
}

- (void)setBoolValue:(BOOL)value forKey:(NSString *)key
{
    if (!self.crashlytics) return;
    [self.crashlytics setBoolValue:value forKey:key];
}

@end
