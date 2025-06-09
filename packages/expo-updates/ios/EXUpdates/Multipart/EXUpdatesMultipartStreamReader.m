//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesMultipartStreamReader.h>

#define CRLF @"\r\n"

@implementation EXUpdatesMultipartStreamReader {
  __strong NSInputStream *_stream;
  __strong NSString *_boundary;
}

- (instancetype)initWithInputStream:(NSInputStream *)stream boundary:(NSString *)boundary
{
  if (self = [super init]) {
    _stream = stream;
    _boundary = boundary;
  }
  return self;
}

- (NSDictionary<NSString *, NSString *> *)parseHeaders:(NSData *)data
{
  NSMutableDictionary *headers = [NSMutableDictionary new];
  NSString *text = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  NSArray<NSString *> *lines = [text componentsSeparatedByString:CRLF];
  for (NSString *line in lines) {
    NSUInteger location = [line rangeOfString:@":"].location;
    if (location == NSNotFound) {
      continue;
    }
    NSString *key = [line substringToIndex:location];
    NSString *value = [[line substringFromIndex:location + 1] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    [headers setValue:value forKey:key];
  }
  return headers;
}

- (void)emitChunk:(NSData *)data headers:(NSDictionary *)headers callback:(EXMultipartCallback)callback done:(BOOL)done
{
  NSData *marker = [CRLF CRLF dataUsingEncoding:NSUTF8StringEncoding];
  NSRange range = [data rangeOfData:marker options:0 range:NSMakeRange(0, data.length)];
  if (range.location == NSNotFound) {
    callback(nil, data, done);
  } else if (headers != nil) {
    // If headers were parsed already just use that to avoid doing it twice.
    NSInteger bodyStart = range.location + marker.length;
    NSData *bodyData = [data subdataWithRange:NSMakeRange(bodyStart, data.length - bodyStart)];
    callback(headers, bodyData, done);
  } else {
    NSData *headersData = [data subdataWithRange:NSMakeRange(0, range.location)];
    NSInteger bodyStart = range.location + marker.length;
    NSData *bodyData = [data subdataWithRange:NSMakeRange(bodyStart, data.length - bodyStart)];
    callback([self parseHeaders:headersData], bodyData, done);
  }
}

- (BOOL)readAllPartsWithCompletionCallback:(EXMultipartCallback)callback
{
  NSInteger chunkStart = 0;
  NSInteger bytesSeen = 0;

  // first delimiter doesn't necessarily need to be preceded by CRLF (boundary can be first thing in body)
  NSData *firstDelimiter = [[NSString stringWithFormat:@"--%@%@", _boundary, CRLF] dataUsingEncoding:NSUTF8StringEncoding];
  NSData *restDelimiter = [[NSString stringWithFormat:@"%@--%@%@", CRLF, _boundary, CRLF] dataUsingEncoding:NSUTF8StringEncoding];
  NSData *delimiter = firstDelimiter;
  
  NSData *closeDelimiter = [[NSString stringWithFormat:@"%@--%@--%@", CRLF, _boundary, CRLF] dataUsingEncoding:NSUTF8StringEncoding];
  NSMutableData *content = [[NSMutableData alloc] initWithCapacity:1];
  NSDictionary *currentHeaders = nil;
  NSUInteger currentHeadersLength = 0;

  const NSUInteger bufferLen = 4 * 1024;
  uint8_t buffer[bufferLen];

  [_stream open];
  while (true) {
    BOOL isCloseDelimiter = NO;
    // Search only a subset of chunk that we haven't seen before + few bytes
    // to allow for the edge case when the delimiter is cut by read call
    NSInteger searchStart = MAX(bytesSeen - (NSInteger)closeDelimiter.length, chunkStart);
    NSRange remainingBufferRange = NSMakeRange(searchStart, content.length - searchStart);

    // Check for delimiters.
    NSRange range = [content rangeOfData:delimiter options:0 range:remainingBufferRange];
    if (range.location == NSNotFound) {
      isCloseDelimiter = YES;
      range = [content rangeOfData:closeDelimiter options:0 range:remainingBufferRange];
    }

    if (range.location == NSNotFound) {
      if (currentHeaders == nil) {
        // Check for the headers delimiter.
        NSData *headersMarker = [CRLF CRLF dataUsingEncoding:NSUTF8StringEncoding];
        NSRange headersRange = [content rangeOfData:headersMarker options:0 range:remainingBufferRange];
        if (headersRange.location != NSNotFound) {
          NSData *headersData = [content subdataWithRange:NSMakeRange(chunkStart, headersRange.location - chunkStart)];
          currentHeadersLength = headersData.length;
          currentHeaders = [self parseHeaders:headersData];
        }
      }

      bytesSeen = content.length;
      NSInteger bytesRead = [_stream read:buffer maxLength:bufferLen];
      if (bytesRead <= 0 || _stream.streamError) {
        [_stream close];
        return NO;
      }
      [content appendBytes:buffer length:bytesRead];
      continue;
    }

    NSInteger chunkEnd = range.location;
    NSInteger length = chunkEnd - chunkStart;
    bytesSeen = chunkEnd;

    // Ignore preamble
    if (chunkStart > 0) {
      NSData *chunk = [content subdataWithRange:NSMakeRange(chunkStart, length)];
      [self emitChunk:chunk headers:currentHeaders callback:callback done:isCloseDelimiter];
      currentHeaders = nil;
      currentHeadersLength = 0;
    }

    if (isCloseDelimiter) {
      [_stream close];
      return YES;
    }

    chunkStart = chunkEnd + delimiter.length;
    
    if (delimiter == firstDelimiter) {
      delimiter = restDelimiter;
    }
  }
}

@end
