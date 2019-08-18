//
//  BNCServerResponse.h
//  Branch-SDK
//
//  Created by Qinwei Gong on 10/10/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

@interface BNCServerResponse : NSObject
@property (nonatomic, strong) NSNumber *statusCode;
@property (nonatomic, strong) id data;
@end
