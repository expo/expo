// Copyright © 2019-present 650 Industries. All rights reserved.

#if __has_include(<ABI38_0_0EXAmplitude/ABI38_0_0EXAmplitude.h>)
#import "ABI38_0_0EXScopedAmplitude.h"
#import <Amplitude-iOS/Amplitude.h>

@interface ABI38_0_0EXAmplitude (Protected)

- (Amplitude *)amplitudeInstance;

@end

@interface ABI38_0_0EXScopedAmplitude ()

@property (strong, nonatomic) NSString *escapedExperienceId;

@end

@implementation ABI38_0_0EXScopedAmplitude

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
