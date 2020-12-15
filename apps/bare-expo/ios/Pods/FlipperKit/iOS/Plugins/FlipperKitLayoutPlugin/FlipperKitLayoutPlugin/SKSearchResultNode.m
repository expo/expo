/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "SKSearchResultNode.h"

@implementation SKSearchResultNode {
  NSString* _nodeId;
  BOOL _isMatch;
  NSDictionary* _element;
  NSArray<SKSearchResultNode*>* _children;
}

- (instancetype)initWithNode:(NSString*)nodeId
                     asMatch:(BOOL)isMatch
                 withElement:(NSDictionary*)element
                 andChildren:(NSArray<SKSearchResultNode*>*)children {
  self = [super init];
  if (self) {
    _nodeId = nodeId;
    _isMatch = isMatch;
    _element = element;
    _children = children;
  }
  return self;
}

- (NSDictionary*)toNSDictionary {
  if (_element == nil) {
    return nil;
  }
  NSMutableArray<NSDictionary*>* childArray;
  if (_children) {
    childArray = [NSMutableArray new];
    for (SKSearchResultNode* child in _children) {
      NSDictionary* childDict = [child toNSDictionary];
      if (childDict) {
        [childArray addObject:childDict];
      }
    }
  } else {
    childArray = nil;
  }
  return @{
    @"id" : _nodeId,
    @"isMatch" : @(_isMatch),
    @"element" : _element,
    @"children" : childArray ?: [NSNull null]
  };
}

@end
