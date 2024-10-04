/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <WebKit/WebKit.h>

@interface ABI42_0_0RNCWKProcessPoolManager : NSObject

+ (instancetype) sharedManager;
- (WKProcessPool *)sharedProcessPoolForScopeKey:(NSString *)scopeKey;

@end
