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

#import "ZXVINParsedResult.h"

@implementation ZXVINParsedResult

- (id)initWithVIN:(NSString *)vin worldManufacturerID:(NSString *)worldManufacturerID
vehicleDescriptorSection:(NSString *)vehicleDescriptorSection vehicleIdentifierSection:(NSString *)vehicleIdentifierSection
      countryCode:(NSString *)countryCode vehicleAttributes:(NSString *)vehicleAttributes modelYear:(int)modelYear
        plantCode:(unichar)plantCode sequentialNumber:(NSString *)sequentialNumber {
  if (self = [super initWithType:kParsedResultTypeVIN]) {
    _vin = vin;
    _worldManufacturerID = worldManufacturerID;
    _vehicleDescriptorSection = vehicleDescriptorSection;
    _vehicleIdentifierSection = vehicleIdentifierSection;
    _countryCode = countryCode;
    _vehicleAttributes = vehicleAttributes;
    _modelYear = modelYear;
    _plantCode = plantCode;
    _sequentialNumber = sequentialNumber;
  }

  return self;
}

- (NSString *)displayResult {
  NSMutableString *result = [NSMutableString stringWithCapacity:50];
  [result appendFormat:@"%@ ", self.worldManufacturerID];
  [result appendFormat:@"%@ ", self.vehicleDescriptorSection];
  [result appendFormat:@"%@\n", self.vehicleIdentifierSection];
  if (self.countryCode) {
    [result appendFormat:@"%@ ", self.countryCode];
  }
  [result appendFormat:@"%d ", self.modelYear];
  [result appendFormat:@"%C ", self.plantCode];
  [result appendFormat:@"%@\n", self.sequentialNumber];
  return [NSString stringWithString:result];
}

@end
