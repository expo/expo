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

@interface ZXURIParsedResult : ZXParsedResult

@property (nonatomic, copy, readonly) NSString *uri;
@property (nonatomic, copy, readonly) NSString *title;

- (id)initWithUri:(NSString *)uri title:(NSString *)title;
+ (id)uriParsedResultWithUri:(NSString *)uri title:(NSString *)title;

/**
 * @return true if the URI contains suspicious patterns that may suggest it intends to
 *  mislead the user about its true nature. At the moment this looks for the presence
 *  of user/password syntax in the host/authority portion of a URI which may be used
 *  in attempts to make the URI's host appear to be other than it is. Example:
 *  http://yourbank.com@phisher.com  This URI connects to phisher.com but may appear
 *  to connect to yourbank.com at first glance.
 */
- (BOOL)possiblyMaliciousURI;

@end
