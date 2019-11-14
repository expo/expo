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

#import "ZXISBNParsedResult.h"
#import "ZXISBNResultParser.h"

@implementation ZXISBNResultParser

/**
 * See <a href="http://www.bisg.org/isbn-13/for.dummies.html">ISBN-13 For Dummies</a>
 */
- (ZXParsedResult *)parse:(ZXResult *)result {
  ZXBarcodeFormat format = [result barcodeFormat];
  if (format != kBarcodeFormatEan13) {
    return nil;
  }
  NSString *rawText = [ZXResultParser massagedText:result];
  NSUInteger length = [rawText length];
  if (length != 13) {
    return nil;
  }
  if (![rawText hasPrefix:@"978"] && ![rawText hasPrefix:@"979"]) {
    return nil;
  }
  return [ZXISBNParsedResult isbnParsedResultWithIsbn:rawText];
}

@end
