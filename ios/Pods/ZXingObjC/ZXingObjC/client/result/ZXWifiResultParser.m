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

#import "ZXResult.h"
#import "ZXWifiResultParser.h"
#import "ZXWifiParsedResult.h"

@implementation ZXWifiResultParser

- (ZXParsedResult *)parse:(ZXResult *)result {
  NSString *rawText = [ZXResultParser massagedText:result];
  if (![rawText hasPrefix:@"WIFI:"]) {
    return nil;
  }
  NSString *ssid = [[self class] matchSinglePrefixedField:@"S:" rawText:rawText endChar:';' trim:NO];
  if (ssid == nil || ssid.length == 0) {
    return nil;
  }
  NSString *pass = [[self class] matchSinglePrefixedField:@"P:" rawText:rawText endChar:';' trim:NO];
  NSString *type = [[self class] matchSinglePrefixedField:@"T:" rawText:rawText endChar:';' trim:NO];
  if (type == nil) {
    type = @"nopass";
  }

  BOOL hidden = [[[self class] matchSinglePrefixedField:@"H:" rawText:rawText endChar:';' trim:NO] boolValue];
  return [ZXWifiParsedResult wifiParsedResultWithNetworkEncryption:type ssid:ssid password:pass hidden:hidden];
}

@end
