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

#import "ZXEANManufacturerOrgSupport.h"

@interface ZXEANManufacturerOrgSupport ()

@property (nonatomic, strong, readonly) NSMutableArray *countryIdentifiers;
@property (nonatomic, strong, readonly) NSMutableArray *ranges;

@end

@implementation ZXEANManufacturerOrgSupport

- (id)init {
  if (self = [super init]) {
    _ranges = [NSMutableArray array];
    _countryIdentifiers = [NSMutableArray array];
  }

  return self;
}

- (NSString *)lookupCountryIdentifier:(NSString *)productCode {
  [self initIfNeeded];

  int prefix = [[productCode substringToIndex:3] intValue];
  NSUInteger max = self.ranges.count;

  for (int i = 0; i < max; i++) {
    NSArray *range = self.ranges[i];
    int start = [range[0] intValue];
    if (prefix < start) {
      return nil;
    }
    int end = [range count] == 1 ? start : [range[1] intValue];
    if (prefix <= end) {
      return self.countryIdentifiers[i];
    }
  }

  return nil;
}

- (void)add:(NSArray *)range identifier:(NSString *)identifier {
  [self.ranges addObject:range];
  [self.countryIdentifiers addObject:identifier];
}

- (void)initIfNeeded {
  @synchronized (self.ranges) {
    if ([self.ranges count] > 0) {
      return;
    }

    [self add:@[@0, @19] identifier:@"US/CA"];
    [self add:@[@30, @39] identifier:@"US"];
    [self add:@[@60, @139] identifier:@"US/CA"];
    [self add:@[@300, @379] identifier:@"FR"];
    [self add:@[@380] identifier:@"BG"];
    [self add:@[@383] identifier:@"SI"];
    [self add:@[@385] identifier:@"HR"];
    [self add:@[@387] identifier:@"BA"];
    [self add:@[@400, @440] identifier:@"DE"];
    [self add:@[@450, @459] identifier:@"JP"];
    [self add:@[@460, @469] identifier:@"RU"];
    [self add:@[@471] identifier:@"TW"];
    [self add:@[@474] identifier:@"EE"];
    [self add:@[@475] identifier:@"LV"];
    [self add:@[@476] identifier:@"AZ"];
    [self add:@[@477] identifier:@"LT"];
    [self add:@[@478] identifier:@"UZ"];
    [self add:@[@479] identifier:@"LK"];
    [self add:@[@480] identifier:@"PH"];
    [self add:@[@481] identifier:@"BY"];
    [self add:@[@482] identifier:@"UA"];
    [self add:@[@484] identifier:@"MD"];
    [self add:@[@485] identifier:@"AM"];
    [self add:@[@486] identifier:@"GE"];
    [self add:@[@487] identifier:@"KZ"];
    [self add:@[@489] identifier:@"HK"];
    [self add:@[@490, @499] identifier:@"JP"];
    [self add:@[@500, @509] identifier:@"GB"];
    [self add:@[@520] identifier:@"GR"];
    [self add:@[@528] identifier:@"LB"];
    [self add:@[@529] identifier:@"CY"];
    [self add:@[@531] identifier:@"MK"];
    [self add:@[@535] identifier:@"MT"];
    [self add:@[@539] identifier:@"IE"];
    [self add:@[@540, @549] identifier:@"BE/LU"];
    [self add:@[@560] identifier:@"PT"];
    [self add:@[@569] identifier:@"IS"];
    [self add:@[@570, @579] identifier:@"DK"];
    [self add:@[@590] identifier:@"PL"];
    [self add:@[@594] identifier:@"RO"];
    [self add:@[@599] identifier:@"HU"];
    [self add:@[@600, @601] identifier:@"ZA"];
    [self add:@[@603] identifier:@"GH"];
    [self add:@[@608] identifier:@"BH"];
    [self add:@[@609] identifier:@"MU"];
    [self add:@[@611] identifier:@"MA"];
    [self add:@[@613] identifier:@"DZ"];
    [self add:@[@616] identifier:@"KE"];
    [self add:@[@618] identifier:@"CI"];
    [self add:@[@619] identifier:@"TN"];
    [self add:@[@621] identifier:@"SY"];
    [self add:@[@622] identifier:@"EG"];
    [self add:@[@624] identifier:@"LY"];
    [self add:@[@625] identifier:@"JO"];
    [self add:@[@626] identifier:@"IR"];
    [self add:@[@627] identifier:@"KW"];
    [self add:@[@628] identifier:@"SA"];
    [self add:@[@629] identifier:@"AE"];
    [self add:@[@640, @649] identifier:@"FI"];
    [self add:@[@690, @695] identifier:@"CN"];
    [self add:@[@700, @709] identifier:@"NO"];
    [self add:@[@729] identifier:@"IL"];
    [self add:@[@730, @739] identifier:@"SE"];
    [self add:@[@740] identifier:@"GT"];
    [self add:@[@741] identifier:@"SV"];
    [self add:@[@742] identifier:@"HN"];
    [self add:@[@743] identifier:@"NI"];
    [self add:@[@744] identifier:@"CR"];
    [self add:@[@745] identifier:@"PA"];
    [self add:@[@746] identifier:@"DO"];
    [self add:@[@750] identifier:@"MX"];
    [self add:@[@754, @755] identifier:@"CA"];
    [self add:@[@759] identifier:@"VE"];
    [self add:@[@760, @769] identifier:@"CH"];
    [self add:@[@770] identifier:@"CO"];
    [self add:@[@773] identifier:@"UY"];
    [self add:@[@775] identifier:@"PE"];
    [self add:@[@777] identifier:@"BO"];
    [self add:@[@779] identifier:@"AR"];
    [self add:@[@780] identifier:@"CL"];
    [self add:@[@784] identifier:@"PY"];
    [self add:@[@785] identifier:@"PE"];
    [self add:@[@786] identifier:@"EC"];
    [self add:@[@789, @790] identifier:@"BR"];
    [self add:@[@800, @839] identifier:@"IT"];
    [self add:@[@840, @849] identifier:@"ES"];
    [self add:@[@850] identifier:@"CU"];
    [self add:@[@858] identifier:@"SK"];
    [self add:@[@859] identifier:@"CZ"];
    [self add:@[@860] identifier:@"YU"];
    [self add:@[@865] identifier:@"MN"];
    [self add:@[@867] identifier:@"KP"];
    [self add:@[@868, @869] identifier:@"TR"];
    [self add:@[@870, @879] identifier:@"NL"];
    [self add:@[@880] identifier:@"KR"];
    [self add:@[@885] identifier:@"TH"];
    [self add:@[@888] identifier:@"SG"];
    [self add:@[@890] identifier:@"IN"];
    [self add:@[@893] identifier:@"VN"];
    [self add:@[@896] identifier:@"PK"];
    [self add:@[@899] identifier:@"ID"];
    [self add:@[@900, @919] identifier:@"AT"];
    [self add:@[@930, @939] identifier:@"AU"];
    [self add:@[@940, @949] identifier:@"AZ"];
    [self add:@[@955] identifier:@"MY"];
    [self add:@[@958] identifier:@"MO"];
  }
}

@end
