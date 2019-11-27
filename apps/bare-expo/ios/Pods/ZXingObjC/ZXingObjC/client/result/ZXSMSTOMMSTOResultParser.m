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

#import "ZXResult.h"
#import "ZXSMSTOMMSTOResultParser.h"
#import "ZXSMSParsedResult.h"

@implementation ZXSMSTOMMSTOResultParser

- (ZXParsedResult *)parse:(ZXResult *)result {
  NSString *rawText = [ZXResultParser massagedText:result];
  if (!([rawText hasPrefix:@"smsto:"] || [rawText hasPrefix:@"SMSTO:"] || [rawText hasPrefix:@"mmsto:"] || [rawText hasPrefix:@"MMSTO:"])) {
    return nil;
  }
  // Thanks to dominik.wild for suggesting this enhancement to support
  // smsto:number:body URIs
  NSString *number = [rawText substringFromIndex:6];
  NSString *body = nil;
  NSUInteger bodyStart = [number rangeOfString:@":"].location;
  if (bodyStart != NSNotFound) {
    body = [number substringFromIndex:bodyStart + 1];
    number = [number substringToIndex:bodyStart];
  }
  return [ZXSMSParsedResult smsParsedResultWithNumber:number via:nil subject:nil body:body];
}

@end
