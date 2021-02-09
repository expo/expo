/* Copyright (c) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !__has_feature(objc_arc)
#error "This file needs to be compiled with ARC enabled."
#endif

#include <objc/runtime.h>

#import "GTLRUploadParameters.h"

@implementation GTLRUploadParameters

@synthesize MIMEType = _MIMEType,
            data = _data,
            fileHandle = _fileHandle,
            uploadLocationURL = _uploadLocationURL,
            fileURL = _fileURL,
            shouldUploadWithSingleRequest = _shouldUploadWithSingleRequest,
            shouldSendUploadOnly = _shouldSendUploadOnly,
            useBackgroundSession = _useBackgroundSession;

+ (instancetype)uploadParametersWithData:(NSData *)data
                                MIMEType:(NSString *)mimeType {
  GTLRUploadParameters *params = [[self alloc] init];
  params.data = data;
  params.MIMEType = mimeType;
  return params;
}

+ (instancetype)uploadParametersWithFileHandle:(NSFileHandle *)fileHandle
                                      MIMEType:(NSString *)mimeType {
  GTLRUploadParameters *params = [[self alloc] init];
  params.fileHandle = fileHandle;
  params.MIMEType = mimeType;
  return params;
}

+ (instancetype)uploadParametersWithFileURL:(NSURL *)fileURL
                                   MIMEType:(NSString *)mimeType {
  GTLRUploadParameters *params = [[self alloc] init];
  params.fileURL = fileURL;
  params.MIMEType = mimeType;
  return params;
}

- (id)copyWithZone:(NSZone *)zone {
  GTLRUploadParameters *newParams = [[[self class] allocWithZone:zone] init];
  newParams.MIMEType = self.MIMEType;
  newParams.data = self.data;
  newParams.fileHandle = self.fileHandle;
  newParams.fileURL = self.fileURL;
  newParams.uploadLocationURL = self.uploadLocationURL;
  newParams.shouldUploadWithSingleRequest = self.shouldUploadWithSingleRequest;
  newParams.shouldSendUploadOnly = self.shouldSendUploadOnly;
  newParams.useBackgroundSession = self.useBackgroundSession;
  return newParams;
}

#if DEBUG
- (NSString *)description {
  NSMutableArray *array = [NSMutableArray array];
  NSString *str = [NSString stringWithFormat:@"MIMEType:%@", _MIMEType];
  [array addObject:str];

  if (_data) {
    str = [NSString stringWithFormat:@"data:%llu bytes",
           (unsigned long long)_data.length];
    [array addObject:str];
  }

  if (_fileHandle) {
    str = [NSString stringWithFormat:@"fileHandle:%@", _fileHandle];
    [array addObject:str];
  }

  if (_fileURL) {
    str = [NSString stringWithFormat:@"file:%@", [_fileURL path]];
    [array addObject:str];
  }

  if (_uploadLocationURL) {
    str = [NSString stringWithFormat:@"uploadLocation:%@",
           [_uploadLocationURL absoluteString]];
    [array addObject:str];
  }

  if (_shouldSendUploadOnly) {
    [array addObject:@"shouldSendUploadOnly"];
  }

  if (_shouldUploadWithSingleRequest) {
    [array addObject:@"uploadWithSingleRequest"];
  }

  if (_useBackgroundSession) {
    [array addObject:@"useBackgroundSession"];
  }

  NSString *descStr = [array componentsJoinedByString:@", "];
  str = [NSString stringWithFormat:@"%@ %p: {%@}",
         [self class], self, descStr];
  return str;
}
#endif  // DEBUG

@end
