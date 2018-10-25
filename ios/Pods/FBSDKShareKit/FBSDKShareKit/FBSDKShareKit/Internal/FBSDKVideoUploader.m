// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKVideoUploader.h"

#import <Foundation/Foundation.h>

#import <FBSDKCoreKit/FBSDKGraphRequestDataAttachment.h>

#import <FBSDKShareKit/FBSDKShareConstants.h>

#import "FBSDKShareDefines.h"
#import "FBSDKShareError.h"

static NSString *const FBSDKVideoUploaderDefaultGraphNode = @"me";
static NSString *const FBSDKVideoUploaderEdge = @"videos";

@implementation FBSDKVideoUploader
{
  NSNumber *_videoID;
  NSNumber *_uploadSessionID;
  NSNumberFormatter *_numberFormatter;
  NSString *_graphPath;
  NSString *_videoName;
  NSUInteger _videoSize;
}

- (instancetype)init NS_UNAVAILABLE
{
  assert(0);
}

#pragma Public Method
- (instancetype)initWithVideoName:(NSString *)videoName videoSize:(NSUInteger)videoSize parameters:(NSDictionary *)parameters delegate:(id<FBSDKVideoUploaderDelegate>)delegate
{
  self = [super init];
  if (self) {
    _parameters = [parameters copy];
    _delegate = delegate;
    _graphNode = FBSDKVideoUploaderDefaultGraphNode;
    _videoName = videoName;
    _videoSize = videoSize;
  }
  return self;
}

- (void)start
{
    _graphPath = [self _graphPathWithSuffix:FBSDKVideoUploaderEdge, nil];
    [self _postStartRequest];
}

#pragma Helper Method

- (void)_postStartRequest
{
  FBSDKGraphRequestHandler startRequestCompletionHandler = ^(FBSDKGraphRequestConnection *connection, id result, NSError *error)
  {
    if (error) {
      [self.delegate videoUploader:self didFailWithError:error];
      return;
    } else {
      result = [FBSDKTypeUtility dictionaryValue:result];
      NSNumber *uploadSessionID = [self.numberFormatter numberFromString:result[FBSDK_SHARE_VIDEO_UPLOAD_SESSION_ID]];
      NSNumber *videoID = [self.numberFormatter numberFromString:result[FBSDK_SHARE_VIDEO_ID]];
      NSDictionary *offsetDictionary = [self _extractOffsetsFromResultDictionary:result];
      if (uploadSessionID == nil || videoID == nil) {
        [self.delegate videoUploader:self didFailWithError:[
                                                            FBSDKShareError errorWithCode:FBSDKShareUnknownErrorCode
                                                                                  message:@"Failed to get valid upload_session_id or video_id."]];
        return;
      } else if (offsetDictionary == nil) {
        return;
      }
      self->_uploadSessionID = uploadSessionID;
      self->_videoID = videoID;
      [self _startTransferRequestWithOffsetDictionary:offsetDictionary];
    }
  };
  if (_videoSize == 0) {
    [self.delegate videoUploader:self didFailWithError:[
                                                        FBSDKShareError errorWithCode:FBSDKShareUnknownErrorCode
                                                        message:[NSString stringWithFormat:@"Invalid video size: %lu", (unsigned long)_videoSize]]];
    return;
  }
  [[[FBSDKGraphRequest alloc] initWithGraphPath:_graphPath
                                     parameters:@{
                                                  FBSDK_SHARE_VIDEO_UPLOAD_PHASE: FBSDK_SHARE_VIDEO_UPLOAD_PHASE_START,
                                                  FBSDK_SHARE_VIDEO_SIZE: [NSString stringWithFormat:@"%tu", _videoSize],
                                                }
                                     HTTPMethod:@"POST"] startWithCompletionHandler:startRequestCompletionHandler];
}

- (void)_startTransferRequestWithOffsetDictionary:(NSDictionary *)offsetDictionary
{
  dispatch_queue_t dataQueue;
  NSOperatingSystemVersion iOS8Version = { .majorVersion = 8, .minorVersion = 0, .patchVersion = 0 };
  if ([FBSDKInternalUtility isOSRunTimeVersionAtLeast:iOS8Version]) {
    dataQueue = dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0);
  } else {
    dataQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0);
  }
  NSUInteger startOffset = [offsetDictionary[FBSDK_SHARE_VIDEO_START_OFFSET] unsignedIntegerValue];
  NSUInteger endOffset = [offsetDictionary[FBSDK_SHARE_VIDEO_END_OFFSET] unsignedIntegerValue];
  if (startOffset == endOffset) {
    [self _postFinishRequest];
    return;
  } else {
    dispatch_async(dataQueue, ^{
      size_t chunkSize = (unsigned long)(endOffset - startOffset);
      NSData *data = [self.delegate videoChunkDataForVideoUploader:self startOffset:startOffset endOffset:endOffset];
      if (data == nil || data.length != chunkSize) {
        [self.delegate videoUploader:self didFailWithError:[FBSDKShareError errorWithCode:FBSDKShareUnknownErrorCode message:
                                                            [NSString stringWithFormat:@"Fail to get video chunk with start offset: %lu, end offset : %lu.", (unsigned long)startOffset, (unsigned long)endOffset]]];
        return;
      }
      dispatch_async(dispatch_get_main_queue(), ^{
        FBSDKGraphRequestDataAttachment *dataAttachment = [[FBSDKGraphRequestDataAttachment alloc] initWithData:data
                                                                                                       filename:self->_videoName
                                                                                                    contentType:nil];
        FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:self->_graphPath
                                                                       parameters:@{
                                                                                    FBSDK_SHARE_VIDEO_UPLOAD_PHASE: FBSDK_SHARE_VIDEO_UPLOAD_PHASE_TRANSFER,
                                                                                    FBSDK_SHARE_VIDEO_START_OFFSET: offsetDictionary[FBSDK_SHARE_VIDEO_START_OFFSET],
                                                                                    FBSDK_SHARE_VIDEO_UPLOAD_SESSION_ID: self->_uploadSessionID,
                                                                                    FBSDK_SHARE_VIDEO_FILE_CHUNK: dataAttachment,
                                                                                    }
                                                                       HTTPMethod:@"POST"];
        [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *innerError) {
          if (innerError) {
            [self.delegate videoUploader:self didFailWithError:innerError];
            return;
          }
          NSDictionary *innerOffsetDictionary = [self _extractOffsetsFromResultDictionary:result];
          if (innerOffsetDictionary == nil) {
            return;
          }
          [self _startTransferRequestWithOffsetDictionary:innerOffsetDictionary];
        }];
      });
    });
  }
}

- (void)_postFinishRequest
{
  NSMutableDictionary *parameters = [[NSMutableDictionary alloc] init];
  parameters[FBSDK_SHARE_VIDEO_UPLOAD_PHASE] = FBSDK_SHARE_VIDEO_UPLOAD_PHASE_FINISH;
  parameters[FBSDK_SHARE_VIDEO_UPLOAD_SESSION_ID] = _uploadSessionID;
  [parameters addEntriesFromDictionary:self.parameters];
  [[[FBSDKGraphRequest alloc] initWithGraphPath:_graphPath
                                     parameters:parameters
                                     HTTPMethod:@"POST"] startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    if (error) {
      [self.delegate videoUploader:self didFailWithError:error];
    } else {
      result = [FBSDKTypeUtility dictionaryValue:result];
      if (result[FBSDK_SHARE_VIDEO_UPLOAD_SUCCESS] == nil) {
        [self.delegate videoUploader:self didFailWithError:[FBSDKShareError errorWithCode:FBSDKShareUnknownErrorCode
                                                                                  message:@"Failed to finish uploading."]];
        return;
      }
      NSMutableDictionary *shareResult = [[NSMutableDictionary alloc] init];
      shareResult[FBSDK_SHARE_VIDEO_UPLOAD_SUCCESS] = result[FBSDK_SHARE_VIDEO_UPLOAD_SUCCESS];
      shareResult[FBSDK_SHARE_RESULT_COMPLETION_GESTURE_KEY] = FBSDK_SHARE_RESULT_COMPLETION_GESTURE_VALUE_POST;
      shareResult[FBSDK_SHARE_VIDEO_ID] = self->_videoID;
      [self.delegate videoUploader:self didCompleteWithResults:shareResult];
    }
  }];
}

- (NSDictionary *)_extractOffsetsFromResultDictionary:(id)result
{
  result = [FBSDKTypeUtility dictionaryValue:result];
  NSNumber *startNum = [self.numberFormatter numberFromString:result[FBSDK_SHARE_VIDEO_START_OFFSET]];
  NSNumber *endNum = [self.numberFormatter numberFromString:result[FBSDK_SHARE_VIDEO_END_OFFSET]];
  if (startNum == nil || endNum == nil) {
    [self.delegate videoUploader:self didFailWithError:[FBSDKShareError errorWithCode:FBSDKShareUnknownErrorCode
                                                                              message:@"Fail to get valid start_offset or end_offset."]];
    return nil;
  }
  if ([startNum compare:endNum] == NSOrderedDescending) {
    [self.delegate videoUploader:self didFailWithError:[FBSDKShareError errorWithCode:FBSDKShareUnknownErrorCode
                                                                              message:@"Invalid offset: start_offset is greater than end_offset."]];
    return nil;
  }

  NSMutableDictionary *shareResults = [[NSMutableDictionary alloc] init];
  shareResults[FBSDK_SHARE_VIDEO_START_OFFSET] = startNum;
  shareResults[FBSDK_SHARE_VIDEO_END_OFFSET] = endNum;
  return shareResults;
}

- (NSNumberFormatter *)numberFormatter
{
  if (!_numberFormatter) {
    _numberFormatter = [[NSNumberFormatter alloc] init];
    _numberFormatter.numberStyle = NSNumberFormatterDecimalStyle;
  }
  return _numberFormatter;
}

- (NSString *)_graphPathWithSuffix:(NSString *)suffix, ... NS_REQUIRES_NIL_TERMINATION
{
  NSMutableString *graphPath = [[NSMutableString alloc] initWithString:self.graphNode];
  va_list args;
  va_start(args, suffix);
  for (NSString *arg = suffix; arg != nil; arg = va_arg(args, NSString *)) {
    [graphPath appendFormat:@"/%@", arg];
  }
  va_end(args);
  return graphPath;
}

@end
