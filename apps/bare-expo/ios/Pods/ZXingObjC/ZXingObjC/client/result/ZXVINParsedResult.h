/*
 * Copyright 2014 ZXing authors
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

@interface ZXVINParsedResult : ZXParsedResult

@property (nonatomic, copy, readonly) NSString *vin;
@property (nonatomic, copy, readonly) NSString *worldManufacturerID;
@property (nonatomic, copy, readonly) NSString *vehicleDescriptorSection;
@property (nonatomic, copy, readonly) NSString *vehicleIdentifierSection;
@property (nonatomic, copy, readonly) NSString *countryCode;
@property (nonatomic, copy, readonly) NSString *vehicleAttributes;
@property (nonatomic, assign, readonly) int modelYear;
@property (nonatomic, assign, readonly) unichar plantCode;
@property (nonatomic, copy, readonly) NSString *sequentialNumber;

- (id)initWithVIN:(NSString *)vin worldManufacturerID:(NSString *)worldManufacturerID
  vehicleDescriptorSection:(NSString *)vehicleDescriptorSection vehicleIdentifierSection:(NSString *)vehicleIdentifierSection
  countryCode:(NSString *)countryCode vehicleAttributes:(NSString *)vehicleAttributes modelYear:(int)modelYear
  plantCode:(unichar)plantCode sequentialNumber:(NSString *)sequentialNumber;


@end
