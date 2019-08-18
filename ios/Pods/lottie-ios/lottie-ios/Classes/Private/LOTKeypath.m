//
//  LOTKeypath.m
//  Lottie_iOS
//
//  Created by brandon_withrow on 12/13/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTKeypath.h"

NSString *const kLOTKeypathEnd = @"LOTENDKEYPATH";

@implementation LOTKeypath {
  NSInteger _currentDepth;
  NSMutableArray<NSNumber *> *_fuzzyDepthStack;
  NSMutableArray *_currentStack;
  NSArray *_keys;
  NSMutableDictionary *_searchResults;
}

+ (nonnull LOTKeypath *)keypathWithString:(nonnull NSString *)keypath {
  return [[self alloc] initWithKeys:[keypath componentsSeparatedByString:@"."]];
}

+ (nonnull LOTKeypath *)keypathWithKeys:(nonnull NSString *)firstKey, ... {
  NSMutableArray *keys = [NSMutableArray array];
  va_list args;
  va_start(args, firstKey);
  for (NSString *arg = firstKey; arg != nil; arg = va_arg(args, NSString*))
  {
    [keys addObject:arg];
  }
  va_end(args);
  return [[self alloc] initWithKeys:keys];
}

- (instancetype)initWithKeys:(NSArray *)keys {
  self = [super init];
  if (self) {
    _keys = [NSArray arrayWithArray:keys];
    NSMutableString *absolutePath = [NSMutableString string];
    for (int i = 0; i < _keys.count; i++) {
      if (i > 0) {
        [absolutePath appendString:@"."];
      }
      [absolutePath appendString:_keys[i]];
    }
    _currentStack = [NSMutableArray array];
    _absoluteKeypath = absolutePath;
    _currentDepth = 0;
    _fuzzyDepthStack = [NSMutableArray array];
    _searchResults = [NSMutableDictionary dictionary];
  }
  return self;
}

- (BOOL)pushKey:(nonnull NSString *)key {
  if (_currentDepth == _keys.count &&
      self.hasFuzzyWildcard == NO) {
    return NO;
  }
  NSString *current = self.currentKey;
  if (self.hasWildcard ||
      [current isEqualToString:key]) {
    [_currentStack addObject:[key copy]];
    _currentDepth ++;
    if (self.hasFuzzyWildcard) {
      [_fuzzyDepthStack addObject:@(_currentDepth)];
    }
    return YES;
  } else if (self.hasFuzzyWildcard) {
    [_currentStack addObject:[key copy]];
    return YES;
  }
  return NO;
}

- (void)popKey {
  if (_currentDepth == 0) {
    return;
  }
  NSInteger stackCount = _currentStack.count;
  [_currentStack removeLastObject];

  if (self.hasFuzzyWildcard ) {
    if (stackCount == _fuzzyDepthStack.lastObject.integerValue) {
      [_fuzzyDepthStack removeLastObject];
    } else {
      return;
    }
  }
  _currentDepth --;
}

- (void)popToRootKey {
  _currentDepth = 0;
  [_currentStack removeAllObjects];
  [_fuzzyDepthStack removeAllObjects];
}

- (NSString *)currentKey {
  if (_currentDepth == _keys.count) {
    return kLOTKeypathEnd;
  }
  return _keys[_currentDepth];
}

- (NSString *)currentKeyPath {
  return [_currentStack componentsJoinedByString:@"."];
}

- (BOOL)hasWildcard {
  if (_currentDepth == _keys.count) {
    return NO;
  }
  return ([_keys[_currentDepth] isEqualToString:@"**"] ||
          [_keys[_currentDepth] isEqualToString:@"*"]);
}

- (BOOL)hasFuzzyWildcard {
  if (_currentDepth == 0 ||
      _currentDepth > _keys.count) {
    return NO;
  }
  return [_keys[_currentDepth - 1] isEqualToString:@"**"];
}

- (BOOL)endOfKeypath {
  return (_currentDepth == _keys.count);
}

- (void)addSearchResultForCurrentPath:(id _Nonnull)result {
  [_searchResults setObject:result forKey:self.currentKeyPath];
}

- (NSDictionary *)searchResults {
  return _searchResults;
}

@end
