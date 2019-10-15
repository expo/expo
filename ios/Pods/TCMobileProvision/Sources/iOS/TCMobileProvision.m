/*
 * Copyright 2015, Torsten Curdt
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "TCMobileProvision.h"
#import "DTASN1Parser.h"

@interface TCMobileProvision () <DTASN1ParserDelegate>

@property (strong, nonatomic) DTASN1Parser *parser;
@property (copy, nonatomic) NSString *currentObjectIdentifier;

@property (strong, nonatomic, readwrite) NSDictionary *dict;

@end

@implementation TCMobileProvision

- (id)initWithData:(NSData *)data
{
    self = [super init];
    if (self) {
        DTASN1Parser *parser = [[DTASN1Parser alloc] initWithData:data];
        parser.delegate = self;

        if (![parser parse]) {
          return nil;
        }
    }
    return self;
}

#pragma mark DTASN1ParserDelegate

- (void)parser:(DTASN1Parser *)parser foundObjectIdentifier:(NSString *)objIdentifier
{
    self.currentObjectIdentifier = objIdentifier;
}

- (void)parser:(DTASN1Parser *)parser foundData:(NSData *)data
{
    if ([@"1.2.840.113549.1.7.1" isEqualToString:self.currentObjectIdentifier]) {

        NSError *err = nil;

        NSDictionary *dict = (NSDictionary *)[NSPropertyListSerialization
                                 propertyListWithData:data
                                              options:NSPropertyListImmutable
                                               format:NULL
                                                error:&err];

        NSAssert(err == nil, @"Failed to parse dictionary %@", err);

        self.dict = dict;

        self.currentObjectIdentifier = nil;
    }
}
@end
