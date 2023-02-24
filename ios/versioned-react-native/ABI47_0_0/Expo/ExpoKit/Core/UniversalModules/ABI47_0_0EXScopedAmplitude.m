// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI47_0_0EXAmplitude/ABI47_0_0EXAmplitude.h>)
#import "ABI47_0_0EXScopedAmplitude.h"
#import <Amplitude/Amplitude.h>

@interface ABI47_0_0EXAmplitude (Protected)

- (Amplitude *)amplitudeInstance;

@end

@interface ABI47_0_0EXScopedAmplitude ()

@property (strong, nonatomic) NSString *escapedScopeKey;

@end

@implementation ABI47_0_0EXScopedAmplitude

- (instancetype)initWithScopeKey:(NSString *)scopeKey
{
  if (self = [super init]) {
    _escapedScopeKey = [self escapedScopeKey:scopeKey];
  }
  return self;
}

- (Amplitude *)amplitudeInstance
{
  return [Amplitude instanceWithName:_escapedScopeKey];
}

- (NSString *)escapedScopeKey:(NSString *)scopeKey
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [scopeKey stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

@end
#endif
