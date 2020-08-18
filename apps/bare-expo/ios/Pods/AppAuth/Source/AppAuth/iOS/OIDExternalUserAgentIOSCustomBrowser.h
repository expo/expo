/*! @file OIDExternalUserAgentIOSCustomBrowser.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2018 Google LLC
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

#import <TargetConditionals.h>

#if TARGET_OS_IOS || TARGET_OS_MACCATALYST

#import <Foundation/Foundation.h>

#import "OIDExternalUserAgent.h"

NS_ASSUME_NONNULL_BEGIN

/*! @brief A block that transforms a regular http/https URL into one that will open in an
        alternative browser.
    @param requestURL the http/https request URL to be transformed.
    @return transformed URL.
 */
typedef NSURL *_Nullable (^OIDCustomBrowserURLTransformation)(NSURL *_Nullable requestURL);

/*! @brief An implementation of the OIDExternalUserAgent protocol for iOS that uses
        a custom browser (i.e. not Safari) for external requests. It is suitable for browsers that
        offer a custom url scheme that simply replaces the "https" scheme. It is not designed
        for browsers that require other modifications to the URL.  If the browser is not installed
        the user will be prompted to install it.
 */
API_UNAVAILABLE(macCatalyst)
@interface OIDExternalUserAgentIOSCustomBrowser : NSObject<OIDExternalUserAgent>

/*! @brief URL transformation block for the browser.
 */
@property(nonatomic, readonly) OIDCustomBrowserURLTransformation URLTransformation;

/*! @brief URL Scheme used to test for whether the browser is installed.
 */
@property(nonatomic, readonly, nullable) NSString *canOpenURLScheme;

/*! @brief URL of the browser's App Store listing.
 */
@property(nonatomic, readonly, nullable) NSURL *appStoreURL;

/*! @brief An instance of @c OIDExternalUserAgentIOSCustomBrowser for Chrome.
 */
+ (instancetype)CustomBrowserChrome;

/*! @brief An instance of @c OIDExternalUserAgentIOSCustomBrowser for Firefox.
 */
+ (instancetype)CustomBrowserFirefox;

/*! @brief An instance of @c OIDExternalUserAgentIOSCustomBrowser for Opera.
 */
+ (instancetype)CustomBrowserOpera;

/*! @brief An instance of @c OIDExternalUserAgentIOSCustomBrowser for Safari.
 */
+ (instancetype)CustomBrowserSafari;

/*! @brief Creates a @c OIDCustomBrowserURLTransformation using the scheme substitution method used
        iOS browsers like Chrome and Firefox.
 */
+ (OIDCustomBrowserURLTransformation)
    URLTransformationSchemeSubstitutionHTTPS:(NSString *)browserSchemeHTTPS
                                        HTTP:(nullable NSString *)browserSchemeHTTP;

/*! @brief Creates a @c OIDCustomBrowserURLTransformation with the URL prefix method used by
        iOS browsers like Firefox.
 */
+ (OIDCustomBrowserURLTransformation) URLTransformationSchemeConcatPrefix:(NSString*)URLprefix;

/*! @internal
    @brief Unavailable. Please use @c initWithURLTransformation:canOpenURLScheme:appStoreURL:
 */
- (nonnull instancetype)init NS_UNAVAILABLE;

/*! @brief OIDExternalUserAgent for a custom browser. @c presentExternalUserAgentRequest:session method
        will return NO if the browser isn't installed.
 */
- (nullable instancetype)initWithURLTransformation:(OIDCustomBrowserURLTransformation)URLTransformation;

/*! @brief The designated initializer.
    @param URLTransformation the transformation block to translate the URL into one that will open
        in the desired custom browser.
    @param canOpenURLScheme any scheme supported by the browser used to check if the browser is
        installed.
    @param appStoreURL URL of the browser in the app store. When this and @c canOpenURLScheme
        are non-nil, @c presentExternalUserAgentRequest:session will redirect the user to the app store
        if the browser is not installed.
 */
- (nullable instancetype)initWithURLTransformation:(OIDCustomBrowserURLTransformation)URLTransformation
                                  canOpenURLScheme:(nullable NSString *)canOpenURLScheme
                                       appStoreURL:(nullable NSURL *)appStoreURL
    NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END

#endif // TARGET_OS_IOS || TARGET_OS_MACCATALYST
