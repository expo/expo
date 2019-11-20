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

#import "ZXProductParsedResult.h"

@implementation ZXProductParsedResult

- (id)initWithProductID:(NSString *)productID {
  return [self initWithProductID:productID normalizedProductID:productID];
}

- (id)initWithProductID:(NSString *)productID normalizedProductID:(NSString *)normalizedProductID {
  if (self = [super initWithType:kParsedResultTypeProduct]) {
    _normalizedProductID = normalizedProductID;
    _productID = productID;
  }

  return self;
}

+ (id)productParsedResultWithProductID:(NSString *)productID {
  return [[self alloc] initWithProductID:productID];
}

+ (id)productParsedResultWithProductID:(NSString *)productID normalizedProductID:(NSString *)normalizedProductID {
  return [[self alloc] initWithProductID:productID normalizedProductID:normalizedProductID];
}

- (NSString *)displayResult {
  return self.productID;
}

@end
