/*
 * Copyright 2019 Google
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

#import "GDTCCTLibrary/Private/GDTCCTNanopbHelpers.h"

#if TARGET_OS_IOS || TARGET_OS_TV
#import <UIKit/UIKit.h>
#elif TARGET_OS_OSX
#import <AppKit/AppKit.h>
#endif  // TARGET_OS_IOS || TARGET_OS_TV

#import <GoogleDataTransport/GDTCORClock.h>
#import <GoogleDataTransport/GDTCORConsoleLogger.h>
#import <GoogleDataTransport/GDTCOREvent.h>
#import <GoogleDataTransport/GDTCORPlatform.h>

#import <nanopb/pb.h>
#import <nanopb/pb_decode.h>
#import <nanopb/pb_encode.h>

#import "GDTCCTLibrary/Private/GDTCOREvent+NetworkConnectionInfo.h"

#pragma mark - General purpose encoders

pb_bytes_array_t *GDTCCTEncodeString(NSString *string) {
  NSData *stringBytes = [string dataUsingEncoding:NSUTF8StringEncoding];
  return GDTCCTEncodeData(stringBytes);
}

pb_bytes_array_t *GDTCCTEncodeData(NSData *data) {
  pb_bytes_array_t *pbBytesArray = calloc(1, PB_BYTES_ARRAY_T_ALLOCSIZE(data.length));
  if (pbBytesArray != NULL) {
    [data getBytes:pbBytesArray->bytes length:data.length];
    pbBytesArray->size = (pb_size_t)data.length;
  }
  return pbBytesArray;
}

#pragma mark - CCT object constructors

NSData *_Nullable GDTCCTEncodeBatchedLogRequest(gdt_cct_BatchedLogRequest *batchedLogRequest) {
  pb_ostream_t sizestream = PB_OSTREAM_SIZING;
  // Encode 1 time to determine the size.
  if (!pb_encode(&sizestream, gdt_cct_BatchedLogRequest_fields, batchedLogRequest)) {
    GDTCORLogError(GDTCORMCEGeneralError, @"Error in nanopb encoding for size: %s",
                   PB_GET_ERROR(&sizestream));
  }

  // Encode a 2nd time to actually get the bytes from it.
  size_t bufferSize = sizestream.bytes_written;
  CFMutableDataRef dataRef = CFDataCreateMutable(CFAllocatorGetDefault(), bufferSize);
  CFDataSetLength(dataRef, bufferSize);
  pb_ostream_t ostream = pb_ostream_from_buffer((void *)CFDataGetBytePtr(dataRef), bufferSize);
  if (!pb_encode(&ostream, gdt_cct_BatchedLogRequest_fields, batchedLogRequest)) {
    GDTCORLogError(GDTCORMCEGeneralError, @"Error in nanopb encoding for bytes: %s",
                   PB_GET_ERROR(&ostream));
  }

  return CFBridgingRelease(dataRef);
}

gdt_cct_BatchedLogRequest GDTCCTConstructBatchedLogRequest(
    NSDictionary<NSString *, NSSet<GDTCOREvent *> *> *logMappingIDToLogSet) {
  gdt_cct_BatchedLogRequest batchedLogRequest = gdt_cct_BatchedLogRequest_init_default;
  NSUInteger numberOfLogRequests = logMappingIDToLogSet.count;
  gdt_cct_LogRequest *logRequests = calloc(numberOfLogRequests, sizeof(gdt_cct_LogRequest));
  if (logRequests == NULL) {
    return batchedLogRequest;
  }

  __block int i = 0;
  [logMappingIDToLogSet enumerateKeysAndObjectsUsingBlock:^(NSString *_Nonnull logMappingID,
                                                            NSSet<GDTCOREvent *> *_Nonnull logSet,
                                                            BOOL *_Nonnull stop) {
    int32_t logSource = [logMappingID intValue];
    gdt_cct_LogRequest logRequest = GDTCCTConstructLogRequest(logSource, logSet);
    logRequests[i] = logRequest;
    i++;
  }];

  batchedLogRequest.log_request = logRequests;
  batchedLogRequest.log_request_count = (pb_size_t)numberOfLogRequests;
  return batchedLogRequest;
}

gdt_cct_LogRequest GDTCCTConstructLogRequest(int32_t logSource,
                                             NSSet<GDTCOREvent *> *_Nonnull logSet) {
  if (logSet.count == 0) {
    GDTCORLogError(GDTCORMCEGeneralError, @"%@",
                   @"An empty event set can't be serialized to proto.");
    gdt_cct_LogRequest logRequest = gdt_cct_LogRequest_init_default;
    return logRequest;
  }
  gdt_cct_LogRequest logRequest = gdt_cct_LogRequest_init_default;
  logRequest.log_source = logSource;
  logRequest.has_log_source = 1;
  logRequest.client_info = GDTCCTConstructClientInfo();
  logRequest.has_client_info = 1;
  logRequest.log_event = calloc(logSet.count, sizeof(gdt_cct_LogEvent));
  if (logRequest.log_event == NULL) {
    return logRequest;
  }
  int i = 0;
  for (GDTCOREvent *log in logSet) {
    gdt_cct_LogEvent logEvent = GDTCCTConstructLogEvent(log);
    logRequest.log_event[i] = logEvent;
    i++;
  }
  logRequest.log_event_count = (pb_size_t)logSet.count;

  GDTCORClock *currentTime = [GDTCORClock snapshot];
  logRequest.request_time_ms = currentTime.timeMillis;
  logRequest.has_request_time_ms = 1;
  logRequest.request_uptime_ms = currentTime.uptime;
  logRequest.has_request_uptime_ms = 1;

  return logRequest;
}

gdt_cct_LogEvent GDTCCTConstructLogEvent(GDTCOREvent *event) {
  gdt_cct_LogEvent logEvent = gdt_cct_LogEvent_init_default;
  logEvent.event_time_ms = event.clockSnapshot.timeMillis;
  logEvent.has_event_time_ms = 1;
  logEvent.event_uptime_ms = event.clockSnapshot.uptime;
  logEvent.has_event_uptime_ms = 1;
  logEvent.timezone_offset_seconds = event.clockSnapshot.timezoneOffsetSeconds;
  logEvent.has_timezone_offset_seconds = 1;
  if (event.customBytes) {
    NSData *networkConnectionInfoData = event.networkConnectionInfoData;
    if (networkConnectionInfoData) {
      [networkConnectionInfoData getBytes:&logEvent.network_connection_info
                                   length:networkConnectionInfoData.length];
      logEvent.has_network_connection_info = 1;
    }
  }
  NSError *error;
  NSData *extensionBytes;
  if (event.fileURL) {
    extensionBytes = [NSData dataWithContentsOfFile:event.fileURL.path options:0 error:&error];
  } else {
    GDTCORLogError(GDTCORMCEFileReadError, @"%@", @"An event's fileURL property was nil.");
    return logEvent;
  }
  if (error) {
    GDTCORLogWarning(GDTCORMCWFileReadError,
                     @"There was an error reading extension bytes from disk: %@", error);
    return logEvent;
  }
  logEvent.source_extension = GDTCCTEncodeData(extensionBytes);  // read bytes from the file.
  return logEvent;
}

gdt_cct_ClientInfo GDTCCTConstructClientInfo() {
  gdt_cct_ClientInfo clientInfo = gdt_cct_ClientInfo_init_default;
  clientInfo.client_type = gdt_cct_ClientInfo_ClientType_IOS_FIREBASE;
  clientInfo.has_client_type = 1;
#if TARGET_OS_IOS || TARGET_OS_TV
  clientInfo.ios_client_info = GDTCCTConstructiOSClientInfo();
  clientInfo.has_ios_client_info = 1;
#elif TARGET_OS_OSX
  // TODO(mikehaney24): Expand the proto to include macOS client info.
#endif
  return clientInfo;
}

gdt_cct_IosClientInfo GDTCCTConstructiOSClientInfo() {
  gdt_cct_IosClientInfo iOSClientInfo = gdt_cct_IosClientInfo_init_default;
#if TARGET_OS_IOS || TARGET_OS_TV
  UIDevice *device = [UIDevice currentDevice];
  NSBundle *bundle = [NSBundle mainBundle];
  NSLocale *locale = [NSLocale currentLocale];
  iOSClientInfo.os_full_version = GDTCCTEncodeString(device.systemVersion);
  NSArray *versionComponents = [device.systemVersion componentsSeparatedByString:@"."];
  iOSClientInfo.os_major_version = GDTCCTEncodeString(versionComponents[0]);
  NSString *version = [bundle objectForInfoDictionaryKey:(NSString *)kCFBundleVersionKey];
  if (version) {
    iOSClientInfo.application_build = GDTCCTEncodeString(version);
  }
  NSString *countryCode = [locale objectForKey:NSLocaleCountryCode];
  if (countryCode) {
    iOSClientInfo.country = GDTCCTEncodeString([locale objectForKey:NSLocaleCountryCode]);
  }
  iOSClientInfo.model = GDTCCTEncodeString(device.model);
  NSString *languageCode = bundle.preferredLocalizations.firstObject;
  iOSClientInfo.language_code =
      languageCode ? GDTCCTEncodeString(languageCode) : GDTCCTEncodeString(@"en");
  iOSClientInfo.application_bundle_id = GDTCCTEncodeString(bundle.bundleIdentifier);
#endif
  return iOSClientInfo;
}

NSData *GDTCCTConstructNetworkConnectionInfoData() {
  gdt_cct_NetworkConnectionInfo networkConnectionInfo = gdt_cct_NetworkConnectionInfo_init_default;
  NSInteger currentNetworkType = GDTCORNetworkTypeMessage();
  if (currentNetworkType) {
    networkConnectionInfo.has_network_type = 1;
    if (currentNetworkType == GDTCORNetworkTypeMobile) {
      networkConnectionInfo.network_type = gdt_cct_NetworkConnectionInfo_NetworkType_MOBILE;
      networkConnectionInfo.mobile_subtype = GDTCCTNetworkConnectionInfoNetworkMobileSubtype();
      if (networkConnectionInfo.mobile_subtype !=
          gdt_cct_NetworkConnectionInfo_MobileSubtype_UNKNOWN_MOBILE_SUBTYPE) {
        networkConnectionInfo.has_mobile_subtype = 1;
      }
    } else {
      networkConnectionInfo.network_type = gdt_cct_NetworkConnectionInfo_NetworkType_WIFI;
    }
  }
  NSData *networkConnectionInfoData = [NSData dataWithBytes:&networkConnectionInfo
                                                     length:sizeof(networkConnectionInfo)];
  return networkConnectionInfoData;
}

gdt_cct_NetworkConnectionInfo_MobileSubtype GDTCCTNetworkConnectionInfoNetworkMobileSubtype() {
  NSNumber *networkMobileSubtypeMessage = @(GDTCORNetworkMobileSubTypeMessage());
  if (!networkMobileSubtypeMessage.intValue) {
    return gdt_cct_NetworkConnectionInfo_MobileSubtype_UNKNOWN_MOBILE_SUBTYPE;
  }
  static NSDictionary<NSNumber *, NSNumber *> *MessageToNetworkSubTypeMessage;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    MessageToNetworkSubTypeMessage = @{
      @(GDTCORNetworkMobileSubtypeGPRS) : @(gdt_cct_NetworkConnectionInfo_MobileSubtype_GPRS),
      @(GDTCORNetworkMobileSubtypeEdge) : @(gdt_cct_NetworkConnectionInfo_MobileSubtype_EDGE),
      @(GDTCORNetworkMobileSubtypeWCDMA) :
          @(gdt_cct_NetworkConnectionInfo_MobileSubtype_UNKNOWN_MOBILE_SUBTYPE),
      @(GDTCORNetworkMobileSubtypeHSDPA) : @(gdt_cct_NetworkConnectionInfo_MobileSubtype_HSDPA),
      @(GDTCORNetworkMobileSubtypeHSUPA) : @(gdt_cct_NetworkConnectionInfo_MobileSubtype_HSUPA),
      @(GDTCORNetworkMobileSubtypeCDMA1x) : @(gdt_cct_NetworkConnectionInfo_MobileSubtype_CDMA),
      @(GDTCORNetworkMobileSubtypeCDMAEVDORev0) :
          @(gdt_cct_NetworkConnectionInfo_MobileSubtype_EVDO_0),
      @(GDTCORNetworkMobileSubtypeCDMAEVDORevA) :
          @(gdt_cct_NetworkConnectionInfo_MobileSubtype_EVDO_A),
      @(GDTCORNetworkMobileSubtypeCDMAEVDORevB) :
          @(gdt_cct_NetworkConnectionInfo_MobileSubtype_EVDO_B),
      @(GDTCORNetworkMobileSubtypeHRPD) : @(gdt_cct_NetworkConnectionInfo_MobileSubtype_EHRPD),
      @(GDTCORNetworkMobileSubtypeLTE) : @(gdt_cct_NetworkConnectionInfo_MobileSubtype_LTE),
    };
  });
  NSNumber *networkMobileSubtype = MessageToNetworkSubTypeMessage[networkMobileSubtypeMessage];
  return networkMobileSubtype.intValue;
}

#pragma mark - CCT Object decoders

gdt_cct_LogResponse GDTCCTDecodeLogResponse(NSData *data, NSError **error) {
  gdt_cct_LogResponse response = gdt_cct_LogResponse_init_default;
  pb_istream_t istream = pb_istream_from_buffer([data bytes], [data length]);
  if (!pb_decode(&istream, gdt_cct_LogResponse_fields, &response)) {
    NSString *nanopb_error = [NSString stringWithFormat:@"%s", PB_GET_ERROR(&istream)];
    NSDictionary *userInfo = @{@"nanopb error:" : nanopb_error};
    if (error != NULL) {
      *error = [NSError errorWithDomain:NSURLErrorDomain code:-1 userInfo:userInfo];
    }
    response = (gdt_cct_LogResponse)gdt_cct_LogResponse_init_default;
  }
  return response;
}
