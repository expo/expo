/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef SKSearchResultNode_h
#define SKSearchResultNode_h

#import <Foundation/Foundation.h>

@interface SKSearchResultNode : NSObject

@property(nonatomic, copy, readonly) NSString* nodeId;

- (instancetype)initWithNode:(NSString*)nodeId
                     asMatch:(BOOL)isMatch
                 withElement:(NSDictionary*)element
                 andChildren:(NSArray<SKSearchResultNode*>*)children;

- (NSDictionary*)toNSDictionary;

@end
#endif /* SKSearchResultNode_h */
