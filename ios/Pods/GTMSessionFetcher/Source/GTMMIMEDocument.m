/* Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GTMMIMEDocument.h"

// Avoid a hard dependency on GTMGatherInputStream.
#ifndef GTM_GATHERINPUTSTREAM_DECLARED
#define GTM_GATHERINPUTSTREAM_DECLARED

@interface GTMGatherInputStream : NSInputStream <NSStreamDelegate>

+ (NSInputStream *)streamWithArray:(NSArray *)dataArray GTM_NONNULL((1));

@end
#endif  // GTM_GATHERINPUTSTREAM_DECLARED

// FindBytes
//
// Helper routine to search for the existence of a set of bytes (needle) within
// a presumed larger set of bytes (haystack). Can find the first part of the
// needle at the very end of the haystack.
//
// Returns the needle length on complete success, the number of bytes matched
// if a partial needle was found at the end of the haystack, and 0 on failure.
static NSUInteger FindBytes(const unsigned char *needle, NSUInteger needleLen,
                            const unsigned char *haystack, NSUInteger haystackLen,
                            NSUInteger *foundOffset);

// SearchDataForBytes
//
// This implements the functionality of the +searchData: methods below. See the documentation
// for those methods.
static void SearchDataForBytes(NSData *data, const void *targetBytes, NSUInteger targetLength,
                               NSMutableArray *foundOffsets, NSMutableArray *foundBlockNumbers);

@implementation GTMMIMEDocumentPart {
  NSDictionary *_headers;
  NSData *_headerData;  // Header content including the ending "\r\n".
  NSData *_bodyData;
}

@synthesize headers = _headers,
            headerData = _headerData,
            body = _bodyData;

@dynamic length;

+ (instancetype)partWithHeaders:(NSDictionary *)headers body:(NSData *)body {
  return [[self alloc] initWithHeaders:headers body:body];
}

- (instancetype)initWithHeaders:(NSDictionary *)headers body:(NSData *)body {
  self = [super init];
  if (self) {
    _bodyData = body;
    _headers = headers;
  }
  return self;
}

// Returns true if the part's header or data contain the given set of bytes.
//
// NOTE: We assume that the 'bytes' we are checking for do not contain "\r\n",
// so we don't need to check the concatenation of the header and body bytes.
- (BOOL)containsBytes:(const unsigned char *)bytes length:(NSUInteger)length {
  // This uses custom search code rather than strcpy because the encoded data may contain
  // null values.
  NSData *headerData = self.headerData;
  return (FindBytes(bytes, length, headerData.bytes, headerData.length, NULL) == length ||
          FindBytes(bytes, length, _bodyData.bytes,  _bodyData.length, NULL) == length);
}

- (NSData *)headerData {
  if (!_headerData) {
    _headerData = [GTMMIMEDocument dataWithHeaders:_headers];
  }
  return _headerData;
}

- (NSData *)body {
  return _bodyData;
}

- (NSUInteger)length {
  return _headerData.length + _bodyData.length;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%@ %p (headers %lu keys, body %lu bytes)",
          [self class], self, (unsigned long)_headers.count,
          (unsigned long)_bodyData.length];
}

- (BOOL)isEqual:(GTMMIMEDocumentPart *)other {
  if (self == other) return YES;
  if (![other isKindOfClass:[GTMMIMEDocumentPart class]]) return NO;
  return ((_bodyData == other->_bodyData || [_bodyData isEqual:other->_bodyData])
          && (_headers == other->_headers || [_headers isEqual:other->_headers]));
}

- (NSUInteger)hash {
  return _bodyData.hash | _headers.hash;
}

@end

@implementation GTMMIMEDocument {
  NSMutableArray *_parts;         // Ordered array of GTMMIMEDocumentParts.
  unsigned long long _length;     // Length in bytes of the document.
  NSString *_boundary;
  u_int32_t _randomSeed;          // For testing.
}

+ (instancetype)MIMEDocument {
  return [[self alloc] init];
}

- (instancetype)init {
  self = [super init];
  if (self) {
    _parts = [[NSMutableArray alloc] init];
  }
  return self;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"%@ %p (%lu parts)",
          [self class], self, (unsigned long)_parts.count];
}

#pragma mark - Joining Parts

// Adds a new part to this mime document with the given headers and body.
- (void)addPartWithHeaders:(NSDictionary *)headers body:(NSData *)body {
  GTMMIMEDocumentPart *part = [GTMMIMEDocumentPart partWithHeaders:headers body:body];
  [_parts addObject:part];
  _boundary = nil;
}

// For unit testing only, seeds the random number generator so that we will
// have reproducible boundary strings.
- (void)seedRandomWith:(u_int32_t)seed {
  _randomSeed = seed;
  _boundary = nil;
}

- (u_int32_t)random {
  if (_randomSeed) {
    // For testing only.
    return _randomSeed++;
  } else {
    return arc4random();
  }
}

// Computes the mime boundary to use.  This should only be called
// after all the desired document parts have been added since it must compute
// a boundary that does not exist in the document data.
- (NSString *)boundary {
  if (_boundary) {
    return _boundary;
  }

  // Use an easily-readable boundary string.
  NSString *const kBaseBoundary = @"END_OF_PART";

  _boundary = kBaseBoundary;

  // If the boundary isn't unique, append random numbers, up to 10 attempts;
  // if that's still not unique, use a random number sequence instead, and call it good.
  BOOL didCollide = NO;

  const int maxTries = 10;  // Arbitrarily chosen maximum attempts.
  for (int tries = 0; tries < maxTries; ++tries) {

    NSData *data = [_boundary dataUsingEncoding:NSUTF8StringEncoding];
    const void *dataBytes = data.bytes;
    NSUInteger dataLen = data.length;

    for (GTMMIMEDocumentPart *part in _parts) {
      didCollide = [part containsBytes:dataBytes length:dataLen];
      if (didCollide) break;
    }

    if (!didCollide) break; // We're fine, no more attempts needed.

    // Try again with a random number appended.
    _boundary = [NSString stringWithFormat:@"%@_%08x", kBaseBoundary, [self random]];
  }

  if (didCollide) {
    // Fallback... two random numbers.
    _boundary = [NSString stringWithFormat:@"%08x_tedborg_%08x", [self random], [self random]];
  }
  return _boundary;
}

- (void)setBoundary:(NSString *)str {
  _boundary = [str copy];
}

// Internal method.
- (void)generateDataArray:(NSMutableArray *)dataArray
                   length:(unsigned long long *)outLength
                 boundary:(NSString **)outBoundary {

  // The input stream is of the form:
  //   --boundary
  //    [part_1_headers]
  //    [part_1_data]
  //   --boundary
  //    [part_2_headers]
  //    [part_2_data]
  //   --boundary--

  // First we set up our boundary NSData objects.
  NSString *boundary = self.boundary;

  NSString *mainBoundary = [NSString stringWithFormat:@"\r\n--%@\r\n", boundary];
  NSString *endBoundary = [NSString stringWithFormat:@"\r\n--%@--\r\n", boundary];

  NSData *mainBoundaryData = [mainBoundary dataUsingEncoding:NSUTF8StringEncoding];
  NSData *endBoundaryData = [endBoundary dataUsingEncoding:NSUTF8StringEncoding];

  // Now we add them all in proper order to our dataArray.
  unsigned long long length = 0;

  for (GTMMIMEDocumentPart *part in _parts) {
    [dataArray addObject:mainBoundaryData];
    [dataArray addObject:part.headerData];
    [dataArray addObject:part.body];

    length += part.length + mainBoundaryData.length;
  }

  [dataArray addObject:endBoundaryData];
  length += endBoundaryData.length;

  if (outLength)   *outLength = length;
  if (outBoundary) *outBoundary = boundary;
}

- (void)generateInputStream:(NSInputStream **)outStream
                     length:(unsigned long long *)outLength
                   boundary:(NSString **)outBoundary {
  NSMutableArray *dataArray = outStream ? [NSMutableArray array] : nil;
  [self generateDataArray:dataArray
                   length:outLength
                 boundary:outBoundary];

  if (outStream) {
    Class streamClass = NSClassFromString(@"GTMGatherInputStream");
    NSAssert(streamClass != nil, @"GTMGatherInputStream not available.");

    *outStream = [streamClass streamWithArray:dataArray];
  }
}

- (void)generateDispatchData:(dispatch_data_t *)outDispatchData
                      length:(unsigned long long *)outLength
                    boundary:(NSString **)outBoundary {
  NSMutableArray *dataArray = outDispatchData ? [NSMutableArray array] : nil;
  [self generateDataArray:dataArray
                   length:outLength
                 boundary:outBoundary];

  if (outDispatchData) {
    // Create an empty data accumulator.
    dispatch_data_t dataAccumulator;

    dispatch_queue_t bgQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);

    for (NSData *partData in dataArray) {
      __block NSData *immutablePartData = [partData copy];
      dispatch_data_t newDataPart =
          dispatch_data_create(immutablePartData.bytes, immutablePartData.length, bgQueue, ^{
        // We want the data retained until this block executes.
        immutablePartData = nil;
      });

      if (dataAccumulator == nil) {
        // First part.
        dataAccumulator = newDataPart;
      } else {
        // Append the additional part.
        dataAccumulator = dispatch_data_create_concat(dataAccumulator, newDataPart);
      }
    }
    *outDispatchData = dataAccumulator;
  }
}

+ (NSData *)dataWithHeaders:(NSDictionary *)headers {
  // Generate the header data by coalescing the dictionary as lines of "key: value\r\n".
  NSMutableString* headerString = [NSMutableString string];

  // Sort the header keys so we have a deterministic order for unit testing.
  SEL sortSel = @selector(caseInsensitiveCompare:);
  NSArray *sortedKeys = [headers.allKeys sortedArrayUsingSelector:sortSel];

  for (NSString *key in sortedKeys) {
    NSString *value = [headers objectForKey:key];

#if DEBUG
    // Look for troublesome characters in the header keys & values.
    NSCharacterSet *badKeyChars = [NSCharacterSet characterSetWithCharactersInString:@":\r\n"];
    NSCharacterSet *badValueChars = [NSCharacterSet characterSetWithCharactersInString:@"\r\n"];

    NSRange badRange = [key rangeOfCharacterFromSet:badKeyChars];
    NSAssert(badRange.location == NSNotFound, @"invalid key: %@", key);

    badRange = [value rangeOfCharacterFromSet:badValueChars];
    NSAssert(badRange.location == NSNotFound, @"invalid value: %@", value);
#endif

    [headerString appendFormat:@"%@: %@\r\n", key, value];
  }
  // Headers end with an extra blank line.
  [headerString appendString:@"\r\n"];

  NSData *result = [headerString dataUsingEncoding:NSUTF8StringEncoding];
  return result;
}

#pragma mark - Separating Parts

+ (NSArray *)MIMEPartsWithBoundary:(NSString *)boundary
                              data:(NSData *)fullDocumentData {
  // In MIME documents, the boundary is preceded by CRLF and two dashes, and followed
  // at the end by two dashes.
  NSData *boundaryData = [boundary dataUsingEncoding:NSUTF8StringEncoding];
  NSUInteger boundaryLength = boundaryData.length;

  NSMutableArray *foundBoundaryOffsets;
  [self searchData:fullDocumentData
       targetBytes:boundaryData.bytes
      targetLength:boundaryLength
      foundOffsets:&foundBoundaryOffsets];

  // According to rfc1341, ignore anything before the first boundary, or after the last, though two
  // dashes are expected to follow the last boundary.
  if (foundBoundaryOffsets.count < 2) {
    return nil;
  }

  // Wrap the full document data with a dispatch_data_t for more efficient slicing
  // and dicing.
  dispatch_data_t dataWrapper;
  if ([fullDocumentData conformsToProtocol:@protocol(OS_dispatch_data)]) {
    dataWrapper = (dispatch_data_t)fullDocumentData;
  } else {
    // A no-op self invocation on fullDocumentData will keep it retained until the block is invoked.
    dispatch_queue_t bgQueue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
    dataWrapper = dispatch_data_create(fullDocumentData.bytes,
                                       fullDocumentData.length,
                                       bgQueue, ^{ [fullDocumentData self]; });
  }
  NSMutableArray *parts;
  NSInteger previousBoundaryOffset = -1;
  NSInteger partCounter = -1;
  NSInteger numberOfPartsWithHeaders = 0;
  for (NSNumber *currentBoundaryOffset in foundBoundaryOffsets) {
    ++partCounter;
    if (previousBoundaryOffset == -1) {
      // This is the first boundary.
      previousBoundaryOffset = currentBoundaryOffset.integerValue;
      continue;
    } else {
      // Create a part data subrange between the previous boundary and this one.
      //
      // The last four bytes before a boundary are CRLF--.
      // The first two bytes following a boundary are either CRLF or, for the last boundary, --.
      NSInteger previousPartDataStartOffset =
          previousBoundaryOffset + (NSInteger)boundaryLength + 2;
      NSInteger previousPartDataEndOffset = currentBoundaryOffset.integerValue - 4;
      NSInteger previousPartDataLength = previousPartDataEndOffset - previousPartDataStartOffset;

      if (previousPartDataLength < 2) {
        // The preceding part was too short to be useful.
#if DEBUG
        NSLog(@"MIME part %ld has %ld bytes", (long)partCounter - 1,
              (long)previousPartDataLength);
#endif
      } else {
        if (!parts) parts = [NSMutableArray array];

        dispatch_data_t partData =
            dispatch_data_create_subrange(dataWrapper,
                (size_t)previousPartDataStartOffset, (size_t)previousPartDataLength);
        // Scan the part data for the separator between headers and body. After the CRLF,
        // either the headers start immediately, or there's another CRLF and there are no headers.
        //
        // We need to map the part data to get the first two bytes. (Or we could cast it to
        // NSData and get the bytes pointer of that.)  If we're concerned that a single part
        // data may be expensive to map, we could make a subrange here for just the first two bytes,
        // and map that two-byte subrange.
        const void *partDataBuffer;
        size_t partDataBufferSize;
        dispatch_data_t mappedPartData NS_VALID_UNTIL_END_OF_SCOPE =
            dispatch_data_create_map(partData, &partDataBuffer, &partDataBufferSize);
        dispatch_data_t bodyData;
        NSDictionary *headers;
        BOOL hasAnotherCRLF = (((char *)partDataBuffer)[0] == '\r'
                               && ((char *)partDataBuffer)[1] == '\n');
        mappedPartData = nil;

        if (hasAnotherCRLF) {
          // There are no headers; skip the CRLF to get to the body, and leave headers nil.
          bodyData = dispatch_data_create_subrange(partData, 2, (size_t)previousPartDataLength - 2);
        } else {
          // There are part headers. They are separated from body data by CRLFCRLF.
          NSArray *crlfOffsets;
          [self searchData:(NSData *)partData
               targetBytes:"\r\n\r\n"
              targetLength:4
              foundOffsets:&crlfOffsets];
          if (crlfOffsets.count == 0) {
#if DEBUG
            // We could not distinguish body and headers.
            NSLog(@"MIME part %ld lacks a header separator: %@", (long)partCounter - 1,
                  [[NSString alloc] initWithData:(NSData *)partData encoding:NSUTF8StringEncoding]);
#endif
          } else {
            NSInteger headerSeparatorOffset = ((NSNumber *)crlfOffsets.firstObject).integerValue;
            dispatch_data_t headerData =
                dispatch_data_create_subrange(partData, 0, (size_t)headerSeparatorOffset);
            headers = [self headersWithData:(NSData *)headerData];

            bodyData = dispatch_data_create_subrange(partData, (size_t)headerSeparatorOffset + 4,
                (size_t)(previousPartDataLength - (headerSeparatorOffset + 4)));

            numberOfPartsWithHeaders++;
          }  // crlfOffsets.count == 0
        }  // hasAnotherCRLF
        GTMMIMEDocumentPart *part = [GTMMIMEDocumentPart partWithHeaders:headers
                                                                    body:(NSData *)bodyData];
        [parts addObject:part];
      }  //  previousPartDataLength < 2
      previousBoundaryOffset = currentBoundaryOffset.integerValue;
    }
  }
#if DEBUG
  // In debug builds, warn if a reasonably long document lacks any CRLF characters.
  if (numberOfPartsWithHeaders == 0) {
    NSUInteger length = fullDocumentData.length;
    if (length > 20) {  // Reasonably long.
      NSMutableArray *foundCRLFs;
      [self searchData:fullDocumentData
           targetBytes:"\r\n"
          targetLength:2
          foundOffsets:&foundCRLFs];
      if (foundCRLFs.count == 0) {
        // Parts were logged above (due to lacking header separators.)
        NSLog(@"Warning: MIME document lacks any headers (may have wrong line endings)");
      }
    }
  }
#endif  // DEBUG
  return parts;
}

// Efficiently search the supplied data for the target bytes.
//
// This uses enumerateByteRangesUsingBlock: to scan for bytes. It can find
// the target even if it spans multiple separate byte ranges.
//
// Returns an array of found byte offset values, as NSNumbers.
+ (void)searchData:(NSData *)data
       targetBytes:(const void *)targetBytes
      targetLength:(NSUInteger)targetLength
      foundOffsets:(GTM_NSArrayOf(NSNumber *) **)outFoundOffsets {
  NSMutableArray *foundOffsets = [NSMutableArray array];
  SearchDataForBytes(data, targetBytes, targetLength, foundOffsets, NULL);
  *outFoundOffsets = foundOffsets;
}


// This version of searchData: also returns the block numbers (0-based) where the
// target was found, used for testing that the supplied dispatch_data buffer
// has not been flattened.
+ (void)searchData:(NSData *)data
       targetBytes:(const void *)targetBytes
      targetLength:(NSUInteger)targetLength
      foundOffsets:(GTM_NSArrayOf(NSNumber *) **)outFoundOffsets
 foundBlockNumbers:(GTM_NSArrayOf(NSNumber *) **)outFoundBlockNumbers {
  NSMutableArray *foundOffsets = [NSMutableArray array];
  NSMutableArray *foundBlockNumbers = [NSMutableArray array];

  SearchDataForBytes(data, targetBytes, targetLength, foundOffsets, foundBlockNumbers);
  *outFoundOffsets = foundOffsets;
  *outFoundBlockNumbers = foundBlockNumbers;
}

static void SearchDataForBytes(NSData *data, const void *targetBytes, NSUInteger targetLength,
                               NSMutableArray *foundOffsets, NSMutableArray *foundBlockNumbers) {
  __block NSUInteger priorPartialMatchAmount = 0;
  __block NSInteger priorPartialMatchStartingBlockNumber = -1;
  __block NSInteger blockNumber = -1;

  [data enumerateByteRangesUsingBlock:^(const void *bytes,
                                        NSRange byteRange,
                                        BOOL *stop) {
    // Search for the first character in the current range.
    const void *ptr = bytes;
    NSInteger remainingInCurrentRange = (NSInteger)byteRange.length;
    ++blockNumber;

    if (priorPartialMatchAmount > 0) {
      NSUInteger amountRemainingToBeMatched = targetLength - priorPartialMatchAmount;
      NSUInteger remainingFoundOffset;
      NSUInteger amountMatched = FindBytes(targetBytes + priorPartialMatchAmount,
                                           amountRemainingToBeMatched,
                                           ptr, (NSUInteger)remainingInCurrentRange, &remainingFoundOffset);
      if (amountMatched == 0 || remainingFoundOffset > 0) {
        // No match of the rest of the prior partial match in this range.
      } else if (amountMatched < amountRemainingToBeMatched) {
        // Another partial match; we're done with this range.
        priorPartialMatchAmount = priorPartialMatchAmount + amountMatched;
        return;
      } else {
        // The offset is in an earlier range.
        NSUInteger offset = byteRange.location - priorPartialMatchAmount;
        [foundOffsets addObject:@(offset)];
        [foundBlockNumbers addObject:@(priorPartialMatchStartingBlockNumber)];
        priorPartialMatchStartingBlockNumber = -1;
      }
      priorPartialMatchAmount = 0;
    }

    while (remainingInCurrentRange > 0) {
      NSUInteger offsetFromPtr;
      NSUInteger amountMatched = FindBytes(targetBytes, targetLength, ptr,
                                           (NSUInteger)remainingInCurrentRange, &offsetFromPtr);
      if (amountMatched == 0) {
        // No match in this range.
        return;
      }
      if (amountMatched < targetLength) {
        // Found a partial target. If there's another range, we'll check for the rest.
        priorPartialMatchAmount = amountMatched;
        priorPartialMatchStartingBlockNumber = blockNumber;
        return;
      }
      // Found the full target.
      NSUInteger globalOffset = byteRange.location + (NSUInteger)(ptr - bytes) + offsetFromPtr;

      [foundOffsets addObject:@(globalOffset)];
      [foundBlockNumbers addObject:@(blockNumber)];

      ptr += targetLength + offsetFromPtr;
      remainingInCurrentRange -= (targetLength + offsetFromPtr);
    }
  }];
}

// Internal method only for testing; this calls through the static method.
+ (NSUInteger)findBytesWithNeedle:(const unsigned char *)needle
                     needleLength:(NSUInteger)needleLength
                         haystack:(const unsigned char *)haystack
                   haystackLength:(NSUInteger)haystackLength
                      foundOffset:(NSUInteger *)foundOffset {
  return FindBytes(needle, needleLength, haystack, haystackLength, foundOffset);
}

// Utility method to parse header bytes into an NSDictionary.
+ (NSDictionary *)headersWithData:(NSData *)data {
  NSString *headersString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  if (!headersString) return nil;

  NSMutableDictionary *headers = [NSMutableDictionary dictionary];
  NSScanner *scanner = [NSScanner scannerWithString:headersString];
  // The scanner is skipping leading whitespace and newline characters by default.
  NSCharacterSet *newlineCharacters = [NSCharacterSet newlineCharacterSet];
  NSString *key;
  NSString *value;
  while ([scanner scanUpToString:@":" intoString:&key]
         && [scanner scanString:@":" intoString:NULL]
         && [scanner scanUpToCharactersFromSet:newlineCharacters intoString:&value]) {
    [headers setObject:value forKey:key];
    // Discard the trailing newline.
    [scanner scanCharactersFromSet:newlineCharacters intoString:NULL];
  }
  return headers;
}

@end

// Return how much of the needle was found in the haystack.
//
// If the result is less than needleLen, then the beginning of the needle
// was found at the end of the haystack.
static NSUInteger FindBytes(const unsigned char* needle, NSUInteger needleLen,
                            const unsigned char* haystack, NSUInteger haystackLen,
                            NSUInteger *foundOffset) {
  const unsigned char *ptr = haystack;
  NSInteger remain = (NSInteger)haystackLen;
  // Assume memchr is an efficient way to find a match for the first
  // byte of the needle, and memcmp is an efficient way to compare a
  // range of bytes.
  while (remain > 0 && (ptr = memchr(ptr, needle[0], (size_t)remain)) != 0) {
    // The first character is present.
    NSUInteger offset = (NSUInteger)(ptr - haystack);
    remain = (NSInteger)(haystackLen - offset);

    NSUInteger amountToCompare = MIN((NSUInteger)remain, needleLen);
    if (memcmp(ptr, needle, amountToCompare) == 0) {
      if (foundOffset) *foundOffset = offset;
      return amountToCompare;
    }
    ptr++;
    remain--;
  }
  if (foundOffset) *foundOffset = 0;
  return 0;
}
