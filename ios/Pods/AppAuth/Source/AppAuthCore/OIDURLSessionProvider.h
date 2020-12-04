/*! @file OIDURLSessionProvider.h
 @brief AppAuth iOS SDK
 @copyright
 Copyright 2015 Google Inc. All Rights Reserved.
 @copydetails
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/*! @brief A NSURLSession provider that allows clients to provide custom implementation
        for NSURLSession
 */
@interface OIDURLSessionProvider : NSObject

/*! @brief Obtains the current @c NSURLSession; using the +[NSURLSession sharedSession] if
        no custom implementation is provided.
    @return NSURLSession object to be used for making network requests.
 */
+ (NSURLSession *)session;

/*! @brief Allows library consumers to change the @c NSURLSession instance used to make
        network requests.
    @param session The @c NSURLSession instance that should be used for making network requests.
 */
+ (void)setSession:(NSURLSession *)session;
@end
NS_ASSUME_NONNULL_END
