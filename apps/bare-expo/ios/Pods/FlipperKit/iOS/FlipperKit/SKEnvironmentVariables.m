/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef FB_SONARKIT_ENABLED

#import "SKEnvironmentVariables.h"

static int const DEFAULT_INSECURE_PORT = 8089;
static int const DEFAULT_SECURE_PORT = 8088;

@implementation SKEnvironmentVariables

+ (int)getInsecurePort {
  NSString* envVar = [self getFlipperPortsVariable];
  return [self extractIntFromPropValue:envVar
                               atIndex:0
                           withDefault:DEFAULT_INSECURE_PORT];
}
+ (int)getSecurePort {
  NSString* envVar = [self getFlipperPortsVariable];
  return [self extractIntFromPropValue:envVar
                               atIndex:1
                           withDefault:DEFAULT_SECURE_PORT];
}
+ (int)extractIntFromPropValue:(NSString*)propValue
                       atIndex:(int)index
                   withDefault:(int)fallback {
  NSArray<NSString*>* components = [propValue componentsSeparatedByString:@","];
  NSString* component = [components objectAtIndex:index];
  int envInt = [component intValue];
  return envInt > 0 ? envInt : fallback;
}
+ (NSString*)getFlipperPortsVariable {
  NSString* value = NSProcessInfo.processInfo.environment[@"FLIPPER_PORTS"];
  return value;
}
@end

#endif
