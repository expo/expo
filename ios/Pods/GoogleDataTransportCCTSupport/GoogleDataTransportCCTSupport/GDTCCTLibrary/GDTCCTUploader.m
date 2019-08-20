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

#import "GDTCCTLibrary/Private/GDTCCTUploader.h"

#import <GoogleDataTransport/GDTConsoleLogger.h>
#import <GoogleDataTransport/GDTPlatform.h>
#import <GoogleDataTransport/GDTRegistrar.h>

#import <nanopb/pb.h>
#import <nanopb/pb_decode.h>
#import <nanopb/pb_encode.h>

#import "GDTCCTLibrary/Private/GDTCCTNanopbHelpers.h"
#import "GDTCCTLibrary/Private/GDTCCTPrioritizer.h"

#import "GDTCCTLibrary/Protogen/nanopb/cct.nanopb.h"

@interface GDTCCTUploader ()

// Redeclared as readwrite.
@property(nullable, nonatomic, readwrite) NSURLSessionUploadTask *currentTask;

/** If running in the background, the current background ID. */
@property(nonatomic) GDTBackgroundIdentifier backgroundID;

@end

@implementation GDTCCTUploader

+ (void)load {
  GDTCCTUploader *uploader = [GDTCCTUploader sharedInstance];
  [[GDTRegistrar sharedInstance] registerUploader:uploader target:kGDTTargetCCT];
}

+ (instancetype)sharedInstance {
  static GDTCCTUploader *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[GDTCCTUploader alloc] init];
  });
  return sharedInstance;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _uploaderQueue = dispatch_queue_create("com.google.GDTCCTUploader", DISPATCH_QUEUE_SERIAL);
    NSURLSessionConfiguration *config = [NSURLSessionConfiguration defaultSessionConfiguration];
    _uploaderSession = [NSURLSession sessionWithConfiguration:config];
    _backgroundID = GDTBackgroundIdentifierInvalid;
  }
  return self;
}

- (NSURL *)defaultServerURL {
  static NSURL *defaultServerURL;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // These strings should be interleaved to construct the real URL. This is just to (hopefully)
    // fool github URL scanning bots.
    const char *p1 = "hts/frbslgiggolai.o/0clgbth";
    const char *p2 = "tp:/ieaeogn.ogepscmvc/o/ac";
    const char defaultURL[54] = {
        p1[0],  p2[0],  p1[1],  p2[1],  p1[2],  p2[2],  p1[3],  p2[3],  p1[4],  p2[4],  p1[5],
        p2[5],  p1[6],  p2[6],  p1[7],  p2[7],  p1[8],  p2[8],  p1[9],  p2[9],  p1[10], p2[10],
        p1[11], p2[11], p1[12], p2[12], p1[13], p2[13], p1[14], p2[14], p1[15], p2[15], p1[16],
        p2[16], p1[17], p2[17], p1[18], p2[18], p1[19], p2[19], p1[20], p2[20], p1[21], p2[21],
        p1[22], p2[22], p1[23], p2[23], p1[24], p2[24], p1[25], p2[25], p1[26], '\0'};
    defaultServerURL = [NSURL URLWithString:[NSString stringWithUTF8String:defaultURL]];
  });
  return defaultServerURL;
}

- (void)uploadPackage:(GDTUploadPackage *)package {
  dispatch_async(_uploaderQueue, ^{
    if (self->_currentTask || self->_currentUploadPackage) {
      GDTLogWarning(GDTMCWUploadFailed, @"%@",
                    @"An upload shouldn't be initiated with another in progress.");
      return;
    }
    NSURL *serverURL = self.serverURL ? self.serverURL : [self defaultServerURL];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:serverURL];
    request.HTTPMethod = @"POST";

    id completionHandler =
        ^(NSData *_Nullable data, NSURLResponse *_Nullable response, NSError *_Nullable error) {
          if (error) {
            GDTLogWarning(GDTMCWUploadFailed, @"There was an error uploading events: %@", error);
          }
          NSError *decodingError;
          gdt_cct_LogResponse logResponse = GDTCCTDecodeLogResponse(data, &decodingError);
          if (!decodingError && logResponse.has_next_request_wait_millis) {
            self->_nextUploadTime =
                [GDTClock clockSnapshotInTheFuture:logResponse.next_request_wait_millis];
          } else {
            // 15 minutes from now.
            self->_nextUploadTime = [GDTClock clockSnapshotInTheFuture:15 * 60 * 1000];
          }
          pb_release(gdt_cct_LogResponse_fields, &logResponse);
          [package completeDelivery];
          if (self->_backgroundID != GDTBackgroundIdentifierInvalid) {
            [[GDTApplication sharedApplication] endBackgroundTask:self->_backgroundID];
            self->_backgroundID = GDTBackgroundIdentifierInvalid;
          }
          self.currentTask = nil;
          self.currentUploadPackage = nil;
        };
    self->_currentUploadPackage = package;
    NSData *requestProtoData = [self constructRequestProtoFromPackage:(GDTUploadPackage *)package];
    self.currentTask = [self.uploaderSession uploadTaskWithRequest:request
                                                          fromData:requestProtoData
                                                 completionHandler:completionHandler];
    [self.currentTask resume];
  });
}

- (BOOL)readyToUploadWithConditions:(GDTUploadConditions)conditions {
  __block BOOL result = NO;
  dispatch_sync(_uploaderQueue, ^{
    if (self->_currentUploadPackage) {
      result = NO;
      return;
    }
    if (self->_currentTask) {
      result = NO;
      return;
    }
    if ((conditions & GDTUploadConditionHighPriority) == GDTUploadConditionHighPriority) {
      result = YES;
      return;
    } else if (self->_nextUploadTime) {
      result = [[GDTClock snapshot] isAfter:self->_nextUploadTime];
      return;
    }
    result = YES;
  });
  return result;
}

#pragma mark - Private helper methods

/** Constructs data given an upload package.
 *
 * @param package The upload package used to construct the request proto bytes.
 * @return Proto bytes representing a gdt_cct_LogRequest object.
 */
- (nonnull NSData *)constructRequestProtoFromPackage:(GDTUploadPackage *)package {
  // Segment the log events by log type.
  NSMutableDictionary<NSString *, NSMutableSet<GDTStoredEvent *> *> *logMappingIDToLogSet =
      [[NSMutableDictionary alloc] init];
  [package.events
      enumerateObjectsUsingBlock:^(GDTStoredEvent *_Nonnull event, BOOL *_Nonnull stop) {
        NSMutableSet *logSet = logMappingIDToLogSet[event.mappingID];
        logSet = logSet ? logSet : [[NSMutableSet alloc] init];
        [logSet addObject:event];
        logMappingIDToLogSet[event.mappingID] = logSet;
      }];

  gdt_cct_BatchedLogRequest batchedLogRequest =
      GDTCCTConstructBatchedLogRequest(logMappingIDToLogSet);

  NSData *data = GDTCCTEncodeBatchedLogRequest(&batchedLogRequest);
  pb_release(gdt_cct_BatchedLogRequest_fields, &batchedLogRequest);
  return data ? data : [[NSData alloc] init];
}

#pragma mark - GDTUploadPackageProtocol

- (void)packageExpired:(GDTUploadPackage *)package {
  dispatch_async(_uploaderQueue, ^{
    [self.currentTask cancel];
    self.currentTask = nil;
    self.currentUploadPackage = nil;
  });
}

#pragma mark - GDTLifecycleProtocol

- (void)appWillBackground:(GDTApplication *)app {
  _backgroundID = [app beginBackgroundTaskWithExpirationHandler:^{
    [app endBackgroundTask:self->_backgroundID];
  }];
}

- (void)appWillTerminate:(GDTApplication *)application {
  dispatch_sync(_uploaderQueue, ^{
    [self.currentTask cancel];
    [self.currentUploadPackage completeDelivery];
  });
}

@end
