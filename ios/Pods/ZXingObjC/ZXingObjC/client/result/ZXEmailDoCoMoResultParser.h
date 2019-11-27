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

#import "ZXAbstractDoCoMoResultParser.h"

/**
 * Implements the "MATMSG" email message entry format.
 *
 * Supported keys: TO, SUB, BODY
 */
@interface ZXEmailDoCoMoResultParser : ZXAbstractDoCoMoResultParser

/**
 * This implements only the most basic checking for an email address's validity -- that it contains
 * an '@' and contains no characters disallowed by RFC 2822. This is an overly lenient definition of
 * validity. We want to generally be lenient here since this class is only intended to encapsulate what's
 * in a barcode, not "judge" it.
 */
+ (BOOL)isBasicallyValidEmailAddress:(NSString *)email;

@end
