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

@interface ZXAddressBookParsedResult : ZXParsedResult

@property (nonatomic, readonly, strong) NSArray *names;
@property (nonatomic, readonly, strong) NSArray *nicknames;

/**
 * In Japanese, the name is written in kanji, which can have multiple readings. Therefore a hint
 * is often provided, called furigana, which spells the name phonetically.
 *
 * @return The pronunciation of the names property, often in hiragana or katakana.
 */
@property (nonatomic, readonly, copy) NSString *pronunciation;

@property (nonatomic, readonly, strong) NSArray *phoneNumbers;

/**
 * @return optional descriptions of the type of each phone number. It could be like "HOME", but,
 *  there is no guaranteed or standard format.
 */
@property (nonatomic, readonly, strong) NSArray *phoneTypes;

@property (nonatomic, readonly, strong) NSArray *emails;

/**
 * @return optional descriptions of the type of each e-mail. It could be like "WORK", but,
 *  there is no guaranteed or standard format.
 */
@property (nonatomic, readonly, strong) NSArray *emailTypes;

@property (nonatomic, readonly, copy) NSString *instantMessenger;
@property (nonatomic, readonly, copy) NSString *note;
@property (nonatomic, readonly, strong) NSArray *addresses;

/**
 * @return optional descriptions of the type of each e-mail. It could be like "WORK", but,
 *  there is no guaranteed or standard format.
 */
@property (nonatomic, readonly, strong) NSArray *addressTypes;

@property (nonatomic, readonly, copy) NSString *title;
@property (nonatomic, readonly, copy) NSString *org;
@property (nonatomic, readonly, strong) NSArray *urls;

/**
 * @return birthday formatted as yyyyMMdd (e.g. 19780917)
 */
@property (nonatomic, readonly, copy) NSString *birthday;

/**
 * @return a location as a latitude/longitude pair
 */
@property (nonatomic, readonly, strong) NSArray *geo;

- (id)initWithNames:(NSArray *)names phoneNumbers:(NSArray *)phoneNumbers
         phoneTypes:(NSArray *)phoneTypes emails:(NSArray *)emails emailTypes:(NSArray *)emailTypes
          addresses:(NSArray *)addresses addressTypes:(NSArray *)addressTypes;

- (id)initWithNames:(NSArray *)names nicknames:(NSArray *)nicknames pronunciation:(NSString *)pronunciation
       phoneNumbers:(NSArray *)phoneNumbers phoneTypes:(NSArray *)phoneTypes emails:(NSArray *)emails
         emailTypes:(NSArray *)emailTypes instantMessenger:(NSString *)instantMessenger note:(NSString *)note
          addresses:(NSArray *)addresses addressTypes:(NSArray *)addressTypes org:(NSString *)org
           birthday:(NSString *)birthday title:(NSString *)title urls:(NSArray *)urls geo:(NSArray *)geo;

+ (id)addressBookParsedResultWithNames:(NSArray *)names phoneNumbers:(NSArray *)phoneNumbers
                            phoneTypes:(NSArray *)phoneTypes emails:(NSArray *)emails emailTypes:(NSArray *)emailTypes
                             addresses:(NSArray *)addresses addressTypes:(NSArray *)addressTypes;

+ (id)addressBookParsedResultWithNames:(NSArray *)names nicknames:(NSArray *)nicknames
                         pronunciation:(NSString *)pronunciation phoneNumbers:(NSArray *)phoneNumbers
                            phoneTypes:(NSArray *)phoneTypes emails:(NSArray *)emails emailTypes:(NSArray *)emailTypes
                      instantMessenger:(NSString *)instantMessenger note:(NSString *)note addresses:(NSArray *)addresses
                          addressTypes:(NSArray *)addressTypes org:(NSString *)org birthday:(NSString *)birthday
                                 title:(NSString *)title urls:(NSArray *)urls geo:(NSArray *)geo;

@end
