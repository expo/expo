//
//  BNCSKAdNetwork.h
//  Branch
//
//  Created by Ernest Cho on 8/12/20.
//  Copyright © 2020 Branch, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface BNCSKAdNetwork : NSObject

@property (nonatomic, assign, readwrite) NSTimeInterval maxTimeSinceInstall;

+ (BNCSKAdNetwork *)sharedInstance;

- (void)registerAppForAdNetworkAttribution;

- (void)updateConversionValue:(NSInteger)conversionValue;

@end

NS_ASSUME_NONNULL_END
