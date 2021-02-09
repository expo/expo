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

#import "ZXExpandedProductParsedResult.h"

NSString * const ZX_KILOGRAM = @"KG";
NSString * const ZX_POUND = @"LB";

@implementation ZXExpandedProductParsedResult

- (id)init {
  return [self initWithRawText:@"" productID:@"" sscc:@"" lotNumber:@"" productionDate:@"" packagingDate:@""
                bestBeforeDate:@"" expirationDate:@"" weight:@"" weightType:@"" weightIncrement:@"" price:@""
                priceIncrement:@"" priceCurrency:@"" uncommonAIs:[NSMutableDictionary dictionary]];
}

- (id)initWithRawText:(NSString *)rawText productID:(NSString *)productID sscc:(NSString *)sscc
            lotNumber:(NSString *)lotNumber productionDate:(NSString *)productionDate
        packagingDate:(NSString *)packagingDate bestBeforeDate:(NSString *)bestBeforeDate
       expirationDate:(NSString *)expirationDate weight:(NSString *)weight weightType:(NSString *)weightType
      weightIncrement:(NSString *)weightIncrement price:(NSString *)price priceIncrement:(NSString *)priceIncrement
        priceCurrency:(NSString *)priceCurrency uncommonAIs:(NSMutableDictionary *)uncommonAIs {
  if (self = [super initWithType:kParsedResultTypeProduct]) {
    _rawText = rawText;
    _productID = productID;
    _sscc = sscc;
    _lotNumber = lotNumber;
    _productionDate = productionDate;
    _packagingDate = packagingDate;
    _bestBeforeDate = bestBeforeDate;
    _expirationDate = expirationDate;
    _weight = weight;
    _weightType = weightType;
    _weightIncrement = weightIncrement;
    _price = price;
    _priceIncrement = priceIncrement;
    _priceCurrency = priceCurrency;
    _uncommonAIs = uncommonAIs;
  }

  return self;
}

+ (id)expandedProductParsedResultWithRawText:(NSString *)rawText productID:(NSString *)productID sscc:(NSString *)sscc
                                   lotNumber:(NSString *)lotNumber productionDate:(NSString *)productionDate
                               packagingDate:(NSString *)packagingDate bestBeforeDate:(NSString *)bestBeforeDate
                              expirationDate:(NSString *)expirationDate weight:(NSString *)weight
                                  weightType:(NSString *)weightType weightIncrement:(NSString *)weightIncrement
                                       price:(NSString *)price priceIncrement:(NSString *)priceIncrement
                               priceCurrency:(NSString *)priceCurrency uncommonAIs:(NSMutableDictionary *)uncommonAIs {
  return [[self alloc] initWithRawText:rawText productID:productID sscc:sscc lotNumber:lotNumber
                        productionDate:productionDate packagingDate:packagingDate bestBeforeDate:bestBeforeDate
                        expirationDate:expirationDate weight:weight weightType:weightType
                       weightIncrement:weightIncrement price:price priceIncrement:priceIncrement
                         priceCurrency:priceCurrency uncommonAIs:uncommonAIs];
}

- (BOOL)isEqual:(id)o {
  if (![o isKindOfClass:[self class]]) {
    return NO;
  }

  ZXExpandedProductParsedResult *other = (ZXExpandedProductParsedResult *)o;

  return [self equalsOrNil:self.productID o2:other.productID]
    && [self equalsOrNil:self.sscc o2:other.sscc]
    && [self equalsOrNil:self.lotNumber o2:other.lotNumber]
    && [self equalsOrNil:self.productionDate o2:other.productionDate]
    && [self equalsOrNil:self.bestBeforeDate o2:other.bestBeforeDate]
    && [self equalsOrNil:self.expirationDate o2:other.expirationDate]
    && [self equalsOrNil:self.weight o2:other.weight]
    && [self equalsOrNil:self.weightType o2:other.weightType]
    && [self equalsOrNil:self.weightIncrement o2:other.weightIncrement]
    && [self equalsOrNil:self.price o2:other.price]
    && [self equalsOrNil:self.priceIncrement o2:other.priceIncrement]
    && [self equalsOrNil:self.priceCurrency o2:other.priceCurrency]
    && [self equalsOrNil:self.uncommonAIs o2:other.uncommonAIs];
}

- (BOOL)equalsOrNil:(id)o1 o2:(id)o2 {
  return o1 == nil ? o2 == nil : [o1 isEqual:o2];
}

- (NSUInteger)hash {
  int hash = 0;
  hash ^= [self.productID hash];
  hash ^= [self.sscc hash];
  hash ^= [self.lotNumber hash];
  hash ^= [self.productionDate hash];
  hash ^= [self.bestBeforeDate hash];
  hash ^= [self.expirationDate hash];
  hash ^= [self.weight hash];
  hash ^= [self.weightType hash];
  hash ^= [self.weightIncrement hash];
  hash ^= [self.price hash];
  hash ^= [self.priceIncrement hash];
  hash ^= [self.priceCurrency hash];
  hash ^= [self.uncommonAIs hash];
  return hash;
}

- (NSString *)displayResult {
  return self.rawText;
}

@end
