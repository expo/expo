// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<EXAmplitude/EXAmplitude.h>)
#import "EXScopedAmplitude.h"
#import <Amplitude/Amplitude.h>

@interface EXAmplitude (Protected)

- (Amplitude *)amplitudeInstance;

@end

@interface EXScopedAmplitude ()

@property (strong, nonatomic) NSString *escapedScopeKey;

@end

@implementation EXScopedAmplitude

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
