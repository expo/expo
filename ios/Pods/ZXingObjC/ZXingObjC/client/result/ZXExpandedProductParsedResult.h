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

#import "ZXParsedResult.h"

extern NSString * const ZX_KILOGRAM;
extern NSString * const ZX_POUND;

@interface ZXExpandedProductParsedResult : ZXParsedResult

@property (nonatomic, copy, readonly) NSString *rawText;
@property (nonatomic, copy, readonly) NSString *productID;
@property (nonatomic, copy, readonly) NSString *sscc;
@property (nonatomic, copy, readonly) NSString *lotNumber;
@property (nonatomic, copy, readonly) NSString *productionDate;
@property (nonatomic, copy, readonly) NSString *packagingDate;
@property (nonatomic, copy, readonly) NSString *bestBeforeDate;
@property (nonatomic, copy, readonly) NSString *expirationDate;
@property (nonatomic, copy, readonly) NSString *weight;
@property (nonatomic, copy, readonly) NSString *weightType;
@property (nonatomic, copy, readonly) NSString *weightIncrement;
@property (nonatomic, copy, readonly) NSString *price;
@property (nonatomic, copy, readonly) NSString *priceIncrement;
@property (nonatomic, copy, readonly) NSString *priceCurrency;
@property (nonatomic, strong, readonly) NSMutableDictionary *uncommonAIs;

- (id)initWithRawText:(NSString *)rawText productID:(NSString *)productID sscc:(NSString *)sscc
            lotNumber:(NSString *)lotNumber productionDate:(NSString *)productionDate
        packagingDate:(NSString *)packagingDate bestBeforeDate:(NSString *)bestBeforeDate
       expirationDate:(NSString *)expirationDate weight:(NSString *)weight weightType:(NSString *)weightType
      weightIncrement:(NSString *)weightIncrement price:(NSString *)price priceIncrement:(NSString *)priceIncrement
        priceCurrency:(NSString *)priceCurrency uncommonAIs:(NSMutableDictionary *)uncommonAIs;
+ (id)expandedProductParsedResultWithRawText:(NSString *)rawText productID:(NSString *)productID sscc:(NSString *)sscc
                                   lotNumber:(NSString *)lotNumber productionDate:(NSString *)productionDate
                               packagingDate:(NSString *)packagingDate bestBeforeDate:(NSString *)bestBeforeDate
                              expirationDate:(NSString *)expirationDate weight:(NSString *)weight
                                  weightType:(NSString *)weightType weightIncrement:(NSString *)weightIncrement
                                       price:(NSString *)price priceIncrement:(NSString *)priceIncrement
                               priceCurrency:(NSString *)priceCurrency uncommonAIs:(NSMutableDictionary *)uncommonAIs;

@end
