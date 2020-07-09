//
//  BNCUserAgentCollector.h
//  Branch
//
//  Created by Ernest Cho on 8/29/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

@import Foundation;

NS_ASSUME_NONNULL_BEGIN

@interface BNCUserAgentCollector : NSObject

+ (BNCUserAgentCollector *)instance;

@property (nonatomic, copy, readwrite) NSString *userAgent;

- (void)loadUserAgentForSystemBuildVersion:(NSString *)systemBuildVersion withCompletion:(void (^)(NSString * _Nullable userAgent))completion;

@end

NS_ASSUME_NONNULL_END
