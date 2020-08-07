//
//  BNCUserAgentCollector.h
//  Branch
//
//  Created by Ernest Cho on 8/29/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

NS_ASSUME_NONNULL_BEGIN

// Handles User Agent lookup from WebKit
@interface BNCUserAgentCollector : NSObject

+ (BNCUserAgentCollector *)instance;

@property (nonatomic, copy, readwrite) NSString *userAgent;

- (void)loadUserAgentWithCompletion:(void (^)(NSString * _Nullable userAgent))completion;

@end

NS_ASSUME_NONNULL_END
