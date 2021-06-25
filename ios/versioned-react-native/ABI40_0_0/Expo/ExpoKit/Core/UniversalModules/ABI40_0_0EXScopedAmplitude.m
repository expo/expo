// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXAmplitude/ABI40_0_0EXAmplitude.h>)
#import "ABI40_0_0EXScopedAmplitude.h"
#import <Amplitude/Amplitude.h>

@interface ABI40_0_0EXAmplitude (Protected)

- (Amplitude *)amplitudeInstance;

@end

@interface ABI40_0_0EXScopedAmplitude ()

@property (strong, nonatomic) NSString *escapedExperienceId;

@end

@implementation ABI40_0_0EXScopedAmplitude

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _escapedExperienceId = [self escapedExperienceId:experienceId];
  }
  return self;
}

- (Amplitude *)amplitudeInstance
{
  return [Amplitude instanceWithName:_escapedExperienceId];
}

- (NSString *)escapedExperienceId:(NSString *)experienceId
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [experienceId stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

@end
#endif
