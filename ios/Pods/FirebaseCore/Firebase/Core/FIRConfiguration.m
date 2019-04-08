// Copyright 2017 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "FIRConfiguration.h"

extern void FIRSetLoggerLevel(FIRLoggerLevel loggerLevel);

@implementation FIRConfiguration

+ (instancetype)sharedInstance {
  static FIRConfiguration *sharedInstance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[FIRConfiguration alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
    _analyticsConfiguration = [FIRAnalyticsConfiguration sharedInstance];
#pragma clang diagnostic pop
  }
  return self;
}

- (void)setLoggerLevel:(FIRLoggerLevel)loggerLevel {
  NSAssert(loggerLevel <= FIRLoggerLevelMax && loggerLevel >= FIRLoggerLevelMin,
           @"Invalid logger level, %ld", (long)loggerLevel);
  FIRSetLoggerLevel(loggerLevel);
}

@end
