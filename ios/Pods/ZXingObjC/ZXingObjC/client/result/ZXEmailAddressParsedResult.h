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

@interface ZXEmailAddressParsedResult : ZXParsedResult

@property (nonatomic, copy, readonly) NSArray *tos;
@property (nonatomic, copy, readonly) NSArray *ccs;
@property (nonatomic, copy, readonly) NSArray *bccs;
@property (nonatomic, copy, readonly) NSString *subject;
@property (nonatomic, copy, readonly) NSString *body;

/**
 * @return first elements of tos or nil if none
 * @deprecated use tos
 */
@property (nonatomic, copy, readonly) NSString *emailAddress DEPRECATED_ATTRIBUTE;

/**
 * @return "mailto:"
 * @deprecated without replacement
 */
@property (nonatomic, copy, readonly) NSString *mailtoURI DEPRECATED_ATTRIBUTE;

- (id)initWithTo:(NSString *)to;
- (id)initWithTos:(NSArray *)tos
              ccs:(NSArray *)ccs
             bccs:(NSArray *)bccs
          subject:(NSString *)subject
             body:(NSString *)body;

@end
