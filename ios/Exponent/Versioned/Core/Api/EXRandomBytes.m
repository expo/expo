//
//  EXRandomBytes.m
//  Exponent
//
//  Created by Evan Bacon on 10/24/18.
//  Copyright © 2018 650 Industries. All rights reserved.
//

/*
  The MIT License (MIT)

  Copyright (c) 2015 Mark Vayngrib

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

#import "EXRandomBytes.h"
#import <React/RCTBridgeModule.h>

@implementation EXRandomBytes

RCT_EXPORT_MODULE(RNRandomBytes)

RCT_EXPORT_METHOD(randomBytes:(NSUInteger)length
                    callback:(RCTResponseSenderBlock)callback)
{
  callback(@[[NSNull null], [self randomBytes:length]]);
}

- (NSString *) randomBytes:(NSUInteger)length
{
  NSMutableData* bytes = [NSMutableData dataWithLength:length];
  SecRandomCopyBytes(kSecRandomDefault, length, [bytes mutableBytes]);
  return [bytes base64EncodedStringWithOptions:0];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"seed": [self randomBytes:4096]
           };
};

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

@end
