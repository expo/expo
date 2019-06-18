/* Copyright (c) 2012 Google Inc.
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

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

NSData * _Nullable GTLRDecodeBase64(NSString * _Nullable base64Str);
NSString * _Nullable GTLREncodeBase64(NSData * _Nullable data);

// "Web-safe" encoding substitutes - and _ for + and / in the encoding table,
// per http://www.ietf.org/rfc/rfc4648.txt section 5.

NSData * _Nullable GTLRDecodeWebSafeBase64(NSString * _Nullable base64Str);
NSString * _Nullable GTLREncodeWebSafeBase64(NSData * _Nullable data);

NS_ASSUME_NONNULL_END
