//
//  BNCSKAdNetwork.m
//  Branch
//
//  Created by Ernest Cho on 8/12/20.
//  Copyright © 2020 Branch, Inc. All rights reserved.
//

#import "BNCSKAdNetwork.h"
#import "BNCApplication.h"

@interface BNCSKAdNetwork()

@property (nonatomic, copy, readwrite) NSDate *installDate;

@property (nonatomic, strong, readwrite) Class skAdNetworkClass;
@property (nonatomic, assign, readwrite) SEL skAdNetworkRegisterAppForAdNetworkAttribution;
@property (nonatomic, assign, readwrite) SEL skAdNetworkUpdateConversionValue;

@end

@implementation BNCSKAdNetwork

+ (BNCSKAdNetwork *)sharedInstance {
    static BNCSKAdNetwork *singleton;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        singleton = [[BNCSKAdNetwork alloc] init];
    });
    return singleton;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        // by default, we send updates to SKAdNetwork for up to 3 days after install
        self.maxTimeSinceInstall = 3600.0 * 24.0 * 3.0;
        self.installDate = [BNCApplication currentApplication].currentInstallDate;
        
        self.skAdNetworkClass = NSClassFromString(@"SKAdNetwork");
        self.skAdNetworkRegisterAppForAdNetworkAttribution = NSSelectorFromString(@"registerAppForAdNetworkAttribution");
        self.skAdNetworkUpdateConversionValue = NSSelectorFromString(@"updateConversionValue:");
    }
    return self;
}

- (BOOL)shouldAttemptSKAdNetworkCallout {
    if (self.installDate && self.skAdNetworkClass) {
        NSDate *now = [NSDate date];
        NSDate *maxDate = [self.installDate dateByAddingTimeInterval:self.maxTimeSinceInstall];
        if ([now compare:maxDate] == NSOrderedDescending) {
            return NO;
        } else {
            return YES;
        }
    }
    return NO;
}

- (void)registerAppForAdNetworkAttribution {
    if (@available(iOS 14.0, *)) {
        if ([self shouldAttemptSKAdNetworkCallout]) {

            // Equivalent call [SKAdNetwork registerAppForAdNetworkAttribution];
            ((id (*)(id, SEL))[self.skAdNetworkClass methodForSelector:self.skAdNetworkRegisterAppForAdNetworkAttribution])(self.skAdNetworkClass, self.skAdNetworkRegisterAppForAdNetworkAttribution);
        }
    }
}

- (void)updateConversionValue:(NSInteger)conversionValue {
    if (@available(iOS 14.0, *)) {
        if ([self shouldAttemptSKAdNetworkCallout]) {
            
            // Equivalent call [SKAdNetwork updateConversionValue:conversionValue];
            ((id (*)(id, SEL, NSInteger))[self.skAdNetworkClass methodForSelector:self.skAdNetworkUpdateConversionValue])(self.skAdNetworkClass, self.skAdNetworkUpdateConversionValue, conversionValue);
        }
    }
}

@end
