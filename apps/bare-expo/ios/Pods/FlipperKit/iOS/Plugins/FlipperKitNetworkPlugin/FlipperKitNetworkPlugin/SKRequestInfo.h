/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@interface SKRequestInfo : NSObject
@property(assign, readwrite) int64_t identifier;
@property(assign, readwrite) uint64_t timestamp;
@property(strong, nonatomic) NSURLRequest* _Nullable request;
@property(strong, nonatomic) NSString* _Nullable body;

- (instancetype _Nonnull)initWithIdentifier:(int64_t)identifier
                                  timestamp:(uint64_t)timestamp
                                    request:(NSURLRequest* _Nullable)request
                                       data:(NSData* _Nullable)data;
- (void)setBodyFromData:(NSData* _Nullable)data;

@end
