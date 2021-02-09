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

#import "ZXTelParsedResult.h"
#import "ZXTelResultParser.h"

@implementation ZXTelResultParser

- (ZXParsedResult *)parse:(ZXResult *)result {
  NSString *rawText = [ZXResultParser massagedText:result];
  if (![rawText hasPrefix:@"tel:"] && ![rawText hasPrefix:@"TEL:"]) {
    return nil;
  }
  // Normalize "TEL:" to "tel:"
  NSString *telURI = [rawText hasPrefix:@"TEL:"] ? [@"tel:" stringByAppendingString:[rawText substringFromIndex:4]] : rawText;
  // Drop tel, query portion
  NSUInteger queryStart = [rawText rangeOfString:@"?" options:NSLiteralSearch range:NSMakeRange(4, [rawText length] - 4)].location;
  NSString *number = queryStart == NSNotFound ? [rawText substringFromIndex:4] : [rawText substringWithRange:NSMakeRange(4, [rawText length] - queryStart)];
  return [ZXTelParsedResult telParsedResultWithNumber:number telURI:telURI title:nil];
}

@end
