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

#import "ZXResultParser.h"

/**
 * Parses an "sms:" URI result, which specifies a number to SMS.
 * See http://tools.ietf.org/html/rfc5724 on this.
 *
 * This class supports "via" syntax for numbers, which is not part of the spec.
 * For example "+12125551212;via=+12124440101" may appear as a number.
 * It also supports a "subject" query parameter, which is not mentioned in the spec.
 * These are included since they were mentioned in earlier IETF drafts and might be
 * used.
 *
 * This actually also parses URIs starting with "mms:" and treats them all the same way,
 * and effectively converts them to an "sms:" URI for purposes of forwarding to the platform.
 */
@interface ZXSMSMMSResultParser : ZXResultParser

@end
