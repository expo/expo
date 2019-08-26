//
//  GTMNSString+URLArguments.h
//
//  Copyright 2006-2008 Google Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not
//  use this file except in compliance with the License.  You may obtain a copy
//  of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
//  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
//  License for the specific language governing permissions and limitations under
//  the License.
//

#import <Foundation/Foundation.h>

/// Utilities for encoding and decoding URL arguments.
@interface NSString (GTMNSStringURLArgumentsAdditions)

/// Returns a string that is escaped properly to be a URL argument.
///
/// This differs from stringByAddingPercentEscapesUsingEncoding: in that it
/// will escape all the reserved characters (per RFC 3986
/// <http://www.ietf.org/rfc/rfc3986.txt>) which
/// stringByAddingPercentEscapesUsingEncoding would leave.
///
/// This will also escape '%', so this should not be used on a string that has
/// already been escaped unless double-escaping is the desired result.
///
/// NOTE: Apps targeting iOS 8 or OS X 10.10 and later should use
///       NSURLComponents and NSURLQueryItem to create properly-escaped
///       URLs instead of using these category methods.
- (NSString*)gtm_stringByEscapingForURLArgument NS_DEPRECATED(10_0, 10_10, 2_0, 8_0, "Use NSURLComponents.");

/// Returns the unescaped version of a URL argument
///
/// This has the same behavior as stringByReplacingPercentEscapesUsingEncoding:,
/// except that it will also convert '+' to space.
- (NSString*)gtm_stringByUnescapingFromURLArgument NS_DEPRECATED(10_0, 10_10, 2_0, 8_0, "Use NSURLComponents.");

@end
