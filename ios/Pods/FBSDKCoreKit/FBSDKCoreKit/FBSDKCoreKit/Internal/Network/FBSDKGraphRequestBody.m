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

#import "FBSDKGraphRequestBody.h"

#import "FBSDKGraphRequestDataAttachment.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings.h"

#define kStringBoundary @"3i2ndDfv2rTHiSisAbouNdArYfORhtTPEefj3q2f"
#define kNewline @"\r\n"

@implementation FBSDKGraphRequestBody
{
  NSMutableData *_data;
  NSMutableDictionary *_json;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _data = [[NSMutableData alloc] init];
    _json = [NSMutableDictionary dictionary];
  }

  return self;
}

- (NSString *)mimeContentType
{
  if (_json) {
    return @"application/json";
  } else {
    return [NSString stringWithFormat:@"multipart/form-data; boundary=%@",kStringBoundary];
  }
}

- (void)appendUTF8:(NSString *)utf8
{
  if (![_data length]) {
    NSString *headerUTF8 = [NSString stringWithFormat:@"--%@%@", kStringBoundary, kNewline];
    NSData *headerData = [headerUTF8 dataUsingEncoding:NSUTF8StringEncoding];
    [_data appendData:headerData];
  }
  NSData *data = [utf8 dataUsingEncoding:NSUTF8StringEncoding];
  [_data appendData:data];
}

- (void)appendWithKey:(NSString *)key
            formValue:(NSString *)value
               logger:(FBSDKLogger *)logger
{
  [self _appendWithKey:key filename:nil contentType:nil contentBlock:^{
    [self appendUTF8:value];
  }];
  if (key && value) {
    [_json setObject:value forKey:key];
  }
  [logger appendFormat:@"\n    %@:\t%@", key, (NSString *)value];
}

- (void)appendWithKey:(NSString *)key
           imageValue:(UIImage *)image
               logger:(FBSDKLogger *)logger
{
  NSData *data = UIImageJPEGRepresentation(image, [FBSDKSettings JPEGCompressionQuality]);
  [self _appendWithKey:key filename:key contentType:@"image/jpeg" contentBlock:^{
    [self->_data appendData:data];
  }];
  _json = nil;
  [logger appendFormat:@"\n    %@:\t<Image - %lu kB>", key, (unsigned long)([data length] / 1024)];
}

- (void)appendWithKey:(NSString *)key
            dataValue:(NSData *)data
               logger:(FBSDKLogger *)logger
{
  [self _appendWithKey:key filename:key contentType:@"content/unknown" contentBlock:^{
    [self->_data appendData:data];
  }];
  _json = nil;
  [logger appendFormat:@"\n    %@:\t<Data - %lu kB>", key, (unsigned long)([data length] / 1024)];
}

- (void)appendWithKey:(NSString *)key
  dataAttachmentValue:(FBSDKGraphRequestDataAttachment *)dataAttachment
               logger:(FBSDKLogger *)logger
{
  NSString *filename = dataAttachment.filename ?: key;
  NSString *contentType = dataAttachment.contentType ?: @"content/unknown";
  NSData *data = dataAttachment.data;
  [self _appendWithKey:key filename:filename contentType:contentType contentBlock:^{
    [self->_data appendData:data];
  }];
  _json = nil;
  [logger appendFormat:@"\n    %@:\t<Data - %lu kB>", key, (unsigned long)([data length] / 1024)];
}

- (NSData *)data
{
  if (_json) {
    NSData *jsonData;
    if (_json.allKeys.count > 0) {
      jsonData = [NSJSONSerialization dataWithJSONObject:_json options:0 error:nil];
    } else {
      jsonData = [NSData data];
    }

    return jsonData;
  }
  return [_data copy];
}

- (void)_appendWithKey:(NSString *)key
              filename:(NSString *)filename
           contentType:(NSString *)contentType
          contentBlock:(void(^)(void))contentBlock
{
  NSMutableArray *disposition = [[NSMutableArray alloc] init];
  [disposition addObject:@"Content-Disposition: form-data"];
  if (key) {
    [disposition addObject:[[NSString alloc] initWithFormat:@"name=\"%@\"", key]];
  }
  if (filename) {
    [disposition addObject:[[NSString alloc] initWithFormat:@"filename=\"%@\"", filename]];
  }
  [self appendUTF8:[[NSString alloc] initWithFormat:@"%@%@", [disposition componentsJoinedByString:@"; "], kNewline]];
  if (contentType) {
    [self appendUTF8:[[NSString alloc] initWithFormat:@"Content-Type: %@%@", contentType, kNewline]];
  }
  [self appendUTF8:kNewline];
  if (contentBlock != NULL) {
    contentBlock();
  }
  [self appendUTF8:[[NSString alloc] initWithFormat:@"%@--%@%@", kNewline, kStringBoundary, kNewline]];
}

@end
