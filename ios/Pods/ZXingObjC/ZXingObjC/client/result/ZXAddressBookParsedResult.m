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

#import "ZXAddressBookParsedResult.h"
#import "ZXParsedResultType.h"

@implementation ZXAddressBookParsedResult

- (id)initWithNames:(NSArray *)names phoneNumbers:(NSArray *)phoneNumbers
         phoneTypes:(NSArray *)phoneTypes emails:(NSArray *)emails emailTypes:(NSArray *)emailTypes
          addresses:(NSArray *)addresses addressTypes:(NSArray *)addressTypes {
  return [self initWithNames:names nicknames:nil pronunciation:nil phoneNumbers:phoneNumbers phoneTypes:phoneNumbers
                      emails:emails emailTypes:_emailTypes instantMessenger:nil note:nil addresses:addresses
                addressTypes:addressTypes org:nil birthday:nil title:nil urls:nil geo:nil];
}

- (id)initWithNames:(NSArray *)names nicknames:(NSArray *)nicknames pronunciation:(NSString *)pronunciation
       phoneNumbers:(NSArray *)phoneNumbers phoneTypes:(NSArray *)phoneTypes emails:(NSArray *)emails
         emailTypes:(NSArray *)emailTypes instantMessenger:(NSString *)instantMessenger note:(NSString *)note
          addresses:(NSArray *)addresses addressTypes:(NSArray *)addressTypes org:(NSString *)org
           birthday:(NSString *)birthday title:(NSString *)title urls:(NSArray *)urls geo:(NSArray *)geo {
  if (self = [super initWithType:kParsedResultTypeAddressBook]) {
    _names = names;
    _nicknames = nicknames;
    _pronunciation = pronunciation;
    _phoneNumbers = phoneNumbers;
    _phoneTypes = phoneTypes;
    _emails = emails;
    _emailTypes = emailTypes;
    _instantMessenger = instantMessenger;
    _note = note;
    _addresses = addresses;
    _addressTypes = addressTypes;
    _org = org;
    _birthday = birthday;
    _title = title;
    _urls = urls;
    _geo = geo;
  }

  return self;
}

+ (id)addressBookParsedResultWithNames:(NSArray *)names phoneNumbers:(NSArray *)phoneNumbers
                            phoneTypes:(NSArray *)phoneTypes emails:(NSArray *)emails emailTypes:(NSArray *)emailTypes
                             addresses:(NSArray *)addresses addressTypes:(NSArray *)addressTypes {
  return [[self alloc] initWithNames:names phoneNumbers:phoneNumbers phoneTypes:phoneTypes emails:emails
                          emailTypes:emailTypes addresses:addresses addressTypes:addressTypes];
}

+ (id)addressBookParsedResultWithNames:(NSArray *)names nicknames:(NSArray *)nicknames
                         pronunciation:(NSString *)pronunciation phoneNumbers:(NSArray *)phoneNumbers
                            phoneTypes:(NSArray *)phoneTypes emails:(NSArray *)emails emailTypes:(NSArray *)emailTypes
                      instantMessenger:(NSString *)instantMessenger note:(NSString *)note addresses:(NSArray *)addresses
                          addressTypes:(NSArray *)addressTypes org:(NSString *)org birthday:(NSString *)birthday
                                 title:(NSString *)title urls:(NSArray *)urls geo:(NSArray *)geo {
  return [[self alloc] initWithNames:names nicknames:nicknames pronunciation:pronunciation phoneNumbers:phoneNumbers
                           phoneTypes:phoneTypes emails:emails emailTypes:emailTypes instantMessenger:instantMessenger
                                note:note addresses:addresses addressTypes:addressTypes org:org birthday:birthday
                               title:title urls:urls geo:geo];
}

- (NSString *)displayResult {
  NSMutableString *result = [NSMutableString string];
  [ZXParsedResult maybeAppendArray:self.names result:result];
  [ZXParsedResult maybeAppendArray:self.nicknames result:result];
  [ZXParsedResult maybeAppend:self.pronunciation result:result];
  [ZXParsedResult maybeAppend:self.title result:result];
  [ZXParsedResult maybeAppend:self.org result:result];
  [ZXParsedResult maybeAppendArray:self.addresses result:result];
  [ZXParsedResult maybeAppendArray:self.phoneNumbers result:result];
  [ZXParsedResult maybeAppendArray:self.emails result:result];
  [ZXParsedResult maybeAppend:self.instantMessenger result:result];
  [ZXParsedResult maybeAppendArray:self.urls result:result];
  [ZXParsedResult maybeAppend:self.birthday result:result];
  [ZXParsedResult maybeAppendArray:self.geo result:result];
  [ZXParsedResult maybeAppend:self.note result:result];
  return result;
}

@end
