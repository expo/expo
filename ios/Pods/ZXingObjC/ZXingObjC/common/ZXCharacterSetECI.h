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

/**
 * Encapsulates a Character Set ECI, according to "Extended Channel Interpretations" 5.3.1.1
 * of ISO 18004.
 */
@interface ZXCharacterSetECI : NSObject

@property (nonatomic, assign, readonly) NSStringEncoding encoding;
@property (nonatomic, assign, readonly) int value;

/**
 * @param value character set ECI value
 * @return CharacterSetECI representing ECI of given value, or nil if it is legal but
 *   unsupported
 */
+ (ZXCharacterSetECI *)characterSetECIByValue:(int)value;

/**
 * @param encoding character set ECI encoding name
 * @return CharacterSetECI representing ECI for character encoding, or nil if it is legal
 *   but unsupported
 */
+ (ZXCharacterSetECI *)characterSetECIByEncoding:(NSStringEncoding)encoding;

@end
