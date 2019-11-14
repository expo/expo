/*
 * Copyright 2012 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "ZXParsedResultType.h"
#import "ZXWifiParsedResult.h"

@implementation ZXWifiParsedResult

- (id)initWithNetworkEncryption:(NSString *)networkEncryption ssid:(NSString *)ssid password:(NSString *)password {
  return [self initWithNetworkEncryption:networkEncryption ssid:ssid password:password];
}

- (id)initWithNetworkEncryption:(NSString *)networkEncryption ssid:(NSString *)ssid password:(NSString *)password hidden:(BOOL)hidden {
  if (self = [super initWithType:kParsedResultTypeWifi]) {
    _ssid = ssid;
    _networkEncryption = networkEncryption;
    _password = password;
    _hidden = hidden;
  }

  return self;
}

+ (id)wifiParsedResultWithNetworkEncryption:(NSString *)networkEncryption ssid:(NSString *)ssid password:(NSString *)password {
  return [[self alloc] initWithNetworkEncryption:networkEncryption ssid:ssid password:password];
}

+ (id)wifiParsedResultWithNetworkEncryption:(NSString *)networkEncryption ssid:(NSString *)ssid password:(NSString *)password hidden:(BOOL)hidden {
  return [[self alloc] initWithNetworkEncryption:networkEncryption ssid:ssid password:password hidden:hidden];
}

- (NSString *)displayResult {
  NSMutableString *result = [NSMutableString stringWithCapacity:80];
  [ZXParsedResult maybeAppend:self.ssid result:result];
  [ZXParsedResult maybeAppend:self.networkEncryption result:result];
  [ZXParsedResult maybeAppend:self.password result:result];
  [ZXParsedResult maybeAppend:[@(self.hidden) stringValue] result:result];
  return result;
}

@end
