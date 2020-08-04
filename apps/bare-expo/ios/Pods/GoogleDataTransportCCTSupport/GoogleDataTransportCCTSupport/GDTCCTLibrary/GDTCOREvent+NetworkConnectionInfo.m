/*
 * Copyright 2020 Google
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

#import "GDTCCTLibrary/Private/GDTCOREvent+NetworkConnectionInfo.h"

#import <GoogleDataTransport/GDTCORConsoleLogger.h>

NSString *const GDTCCTNeedsNetworkConnectionInfo = @"needs_network_connection_info";

NSString *const GDTCCTNetworkConnectionInfo = @"network_connection_info";

@implementation GDTCOREvent (CCTNetworkConnectionInfo)

- (void)setNeedsNetworkConnectionInfoPopulated:(BOOL)needsNetworkConnectionInfoPopulated {
  if (!needsNetworkConnectionInfoPopulated) {
    self.customBytes = nil;
  } else {
    @try {
      NSError *error;
      self.customBytes =
          [NSJSONSerialization dataWithJSONObject:@{GDTCCTNeedsNetworkConnectionInfo : @YES}
                                          options:0
                                            error:&error];
    } @catch (NSException *exception) {
      GDTCORLogDebug(@"Error when setting the event for needs_network_connection_info: %@",
                     exception);
    }
  }
}

- (BOOL)needsNetworkConnectionInfoPopulated {
  if (self.customBytes) {
    @try {
      NSError *error;
      NSDictionary *bytesDict = [NSJSONSerialization JSONObjectWithData:self.customBytes
                                                                options:0
                                                                  error:&error];
      return bytesDict && !error && [bytesDict[GDTCCTNeedsNetworkConnectionInfo] boolValue];
    } @catch (NSException *exception) {
      GDTCORLogDebug(@"Error when checking the event for needs_network_connection_info: %@",
                     exception);
    }
  }
  return NO;
}

- (void)setNetworkConnectionInfoData:(NSData *)networkConnectionInfoData {
  @try {
    NSError *error;
    NSString *dataString = [networkConnectionInfoData base64EncodedStringWithOptions:0];
    if (dataString) {
      self.customBytes =
          [NSJSONSerialization dataWithJSONObject:@{GDTCCTNetworkConnectionInfo : dataString}
                                          options:0
                                            error:&error];
      if (error) {
        self.customBytes = nil;
        GDTCORLogDebug(@"Error when setting an event's network_connection_info: %@", error);
      }
    }
  } @catch (NSException *exception) {
    GDTCORLogDebug(@"Error when setting an event's network_connection_info: %@", exception);
  }
}

- (nullable NSData *)networkConnectionInfoData {
  if (self.customBytes) {
    @try {
      NSError *error;
      NSDictionary *bytesDict = [NSJSONSerialization JSONObjectWithData:self.customBytes
                                                                options:0
                                                                  error:&error];
      NSString *base64Data = bytesDict[GDTCCTNetworkConnectionInfo];
      NSData *networkConnectionInfoData = [[NSData alloc] initWithBase64EncodedString:base64Data
                                                                              options:0];
      if (error) {
        GDTCORLogDebug(@"Error when getting an event's network_connection_info: %@", error);
        return nil;
      } else {
        return networkConnectionInfoData;
      }
    } @catch (NSException *exception) {
      GDTCORLogDebug(@"Error when getting an event's network_connection_info: %@", exception);
    }
  }
  return nil;
}

@end
