/*! @file OIDExternalUserAgent.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2017 The AppAuth Authors. All Rights Reserved.
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

/*! @protocol OIDExternalUserAgent
    @brief An interface that any external user-agent request may implement to use the
        @c OIDExternalUserAgent flow.
 */
@protocol OIDExternalUserAgentRequest

/*! @brief Method to create and return the complete request URL instance.
    @return A @c NSURL instance which contains the URL to be opened in an external UI (i.e. browser)
 */
- (NSURL*)externalUserAgentRequestURL;

/*! @brief If this external user-agent request has a redirect URL, this should return its scheme.
        Since some external requests have optional callbacks (such as the end session endpoint), the
        return value of this method is nullable.
    @return A @c NSString instance that contains the scheme of a callback url, or nil if there is
        no callback url for this request.
 */
- (NSString*)redirectScheme;
@end
