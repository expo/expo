/* Copyright (c) 2011 Google Inc.
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

#import "GTLRObject.h"

NS_ASSUME_NONNULL_BEGIN

@class GTLRErrorObjectErrorItem;
@class GTLRErrorObjectDetail;

/**
 *  This class wraps JSON responses (both V1 and V2 of Google JSON errors) and NSErrors.
 *
 *  A GTLRErrorObject can be created using +objectWithJSON: or +objectWithFoundationError:
 */
@interface GTLRErrorObject : GTLRObject

/**
 *  Convenience method for creating an error object from an NSError.
 *
 *  @param error The @c NSError to be encapsulated by the @c GTLRErrorObject
 *
 *  @return A @c GTLRErrorObject wrapping the NSError.
 */
+ (instancetype)objectWithFoundationError:(NSError *)error;

/**
 *  Convenience utility for extracting the GTLRErrorObject that was used to create an NSError.
 *
 *  @param foundationError The NSError that may have been obtained from a GTLRErrorObject.
 *
 *  @return The GTLRErrorObject, nil if the error was not originally from a GTLRErrorObject.
 */
+ (nullable GTLRErrorObject *)underlyingObjectForError:(NSError *)foundationError;

//
// V1 & V2 properties.
//

/**
 *  The numeric error code.
 */
@property(nonatomic, strong, nullable) NSNumber *code;

/**
 *  An error message string, typically provided by the API server.  This is not localized,
 *  and its reliability depends on the API server.
 */
@property(nonatomic, strong, nullable) NSString *message;

//
// V1 properties.
//

/**
 *  Underlying errors that occurred on the server.
 */
@property(nonatomic, strong, nullable) NSArray<GTLRErrorObjectErrorItem *> *errors;

//
// V2 properties
//

/**
 *  A status error string, defined by the API server, such as "NOT_FOUND".
 */
@property(nonatomic, strong, nullable) NSString *status;

/**
 *  Additional diagnostic error details provided by the API server.
 */
@property(nonatomic, strong, nullable) NSArray<GTLRErrorObjectDetail *> *details;

/**
 *  An NSError, either underlying the error object or manufactured from the error object's
 *  properties.
 */
@property(nonatomic, readonly) NSError *foundationError;

@end

/**
 *  Class representing the items of the "errors" array inside the Google V1 error JSON.
 *
 *  Client applications should not rely on the property values of these items.
 */
@interface GTLRErrorObjectErrorItem : GTLRObject
@property(nonatomic, strong, nullable) NSString *domain;
@property(nonatomic, strong, nullable) NSString *reason;
@property(nonatomic, strong, nullable) NSString *message;
@property(nonatomic, strong, nullable) NSString *location;
@end

/**
 *  Class representing the items of the "details" array inside the Google V2 error JSON.
 *
 *  Client applications should not rely on the property values of these items.
 */
@interface GTLRErrorObjectDetail : GTLRObject
@property(nonatomic, strong, nullable) NSString *type;
@property(nonatomic, strong, nullable) NSString *detail;
@end

NS_ASSUME_NONNULL_END
