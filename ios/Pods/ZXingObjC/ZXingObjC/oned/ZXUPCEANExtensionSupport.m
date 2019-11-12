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

#import "ZXUPCEANExtensionSupport.h"
#import "ZXUPCEANExtension2Support.h"
#import "ZXUPCEANExtension5Support.h"
#import "ZXUPCEANReader.h"

const int ZX_UPCEAN_EXTENSION_START_PATTERN[] = {1,1,2};

@interface ZXUPCEANExtensionSupport ()

@property (nonatomic, strong, readonly) ZXUPCEANExtension2Support *twoSupport;
@property (nonatomic, strong, readonly) ZXUPCEANExtension5Support *fiveSupport;

@end

@implementation ZXUPCEANExtensionSupport

- (id)init {
  if (self = [super init]) {
    _twoSupport = [[ZXUPCEANExtension2Support alloc] init];
    _fiveSupport = [[ZXUPCEANExtension5Support alloc] init];
  }

  return self;
}

- (ZXResult *)decodeRow:(int)rowNumber row:(ZXBitArray *)row rowOffset:(int)rowOffset error:(NSError **)error {
  NSRange extensionStartRange = [ZXUPCEANReader findGuardPattern:row
                                                       rowOffset:rowOffset
                                                      whiteFirst:NO
                                                         pattern:ZX_UPCEAN_EXTENSION_START_PATTERN
                                                      patternLen:sizeof(ZX_UPCEAN_EXTENSION_START_PATTERN)/sizeof(int)
                                                           error:error];

  if (extensionStartRange.location == NSNotFound) {
    return nil;
  }

  ZXResult *result = [self.fiveSupport decodeRow:rowNumber row:row extensionStartRange:extensionStartRange error:error];
  if (!result) {
    result = [self.twoSupport decodeRow:rowNumber row:row extensionStartRange:extensionStartRange error:error];
  }

  return result;
}

@end
