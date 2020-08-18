//
//  BNCAppleReceipt.h
//  Branch
//
//  Created by Ernest Cho on 7/11/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface BNCAppleReceipt : NSObject

+ (BNCAppleReceipt *)sharedInstance;

// this is only available on builds from Apple
- (nullable NSString *)installReceipt;
- (BOOL)isTestFlight;

@end

NS_ASSUME_NONNULL_END
