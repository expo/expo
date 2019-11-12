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

#import "ZXBarcodeFormat.h"
#import "ZXProductParsedResult.h"
#import "ZXProductResultParser.h"
#import "ZXUPCEReader.h"

@implementation ZXProductResultParser

// Treat all UPC and EAN variants as UPCs, in the sense that they are all product barcodes.
- (ZXParsedResult *)parse:(ZXResult *)result {
  ZXBarcodeFormat format = [result barcodeFormat];
  if (!(format == kBarcodeFormatUPCA || format == kBarcodeFormatUPCE || format == kBarcodeFormatEan8 || format == kBarcodeFormatEan13)) {
    return nil;
  }
  NSString *rawText = [ZXResultParser massagedText:result];
  if (![[self class] isStringOfDigits:rawText length:(unsigned int)[rawText length]]) {
    return nil;
  }
  // Not actually checking the checksum again here

  NSString *normalizedProductID;
  if (format == kBarcodeFormatUPCE && [rawText length] == 8) {
    normalizedProductID = [ZXUPCEReader convertUPCEtoUPCA:rawText];
  } else {
    normalizedProductID = rawText;
  }
  return [ZXProductParsedResult productParsedResultWithProductID:rawText normalizedProductID:normalizedProductID];
}

@end
