/*! @file GTMOAuth2Compatibility.h
    @brief GTMAppAuth SDK
    @copyright
        Copyright 2016 Google Inc.
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

#if SWIFT_PACKAGE
#import "../GTMAppAuthFetcherAuthorization.h"
#else
#import "GTMAppAuthFetcherAuthorization.h"
#endif

NS_ASSUME_NONNULL_BEGIN

/*! @brief Class to support serialization and deserialization of @c GTMAppAuthFetcherAuthorization
        in the format used by GTMOAuth2.
    @discussion The methods of this class are capable of serializing and deserializing auth
        objects in a way compatible with the serialization in @c GTMOAuth2ViewControllerTouch and
        @c GTMOAuth2WindowController in GTMOAuth2.
 */
@interface GTMOAuth2KeychainCompatibility : NSObject

/*! @brief Encodes the given @c GTMAppAuthFetcherAuthorization in a GTMOAuth2 compatible persistence
        string using URL param key/value encoding.
    @param authorization The @c GTMAppAuthFetcherAuthorization to serialize in GTMOAuth2 format.
    @return The GTMOAuth2 persistence representation of this object.
 */
+ (NSString *)persistenceResponseStringForAuthorization:
    (GTMAppAuthFetcherAuthorization *)authorization;

/*! @brief Attempts to create a @c GTMAppAuthFetcherAuthorization from data stored in the keychain
        in GTMOAuth2 format, at the supplied keychain identifier.
    @param keychainItemName The keychain name.
    @param tokenURL The OAuth token endpoint URL.
    @param redirectURI The OAuth redirect URI used when obtaining the original authorization.
    @param clientID The OAuth client id.
    @param clientSecret The OAuth client secret.
    @return A @c GTMAppAuthFetcherAuthorization object, or nil.
 */
+ (nullable GTMAppAuthFetcherAuthorization *)
    authorizeFromKeychainForName:(NSString *)keychainItemName
                        tokenURL:(NSURL *)tokenURL
                     redirectURI:(NSString *)redirectURI
                        clientID:(NSString *)clientID
                    clientSecret:(nullable NSString *)clientSecret;

/*! @brief Attempts to create a @c GTMAppAuthFetcherAuthorization from a @c NSString
        representation of the GTMOAuth2 keychain data.
    @param persistenceString String representation of the GTMOAuth2 keychain data.
    @param tokenURL The OAuth token endpoint URL.
    @param redirectURI The OAuth redirect URI used when obtaining the original authorization.
    @param clientID The OAuth client id.
    @param clientSecret The OAuth client secret.
    @return A @c GTMAppAuthFetcherAuthorization object, or nil.
 */
+ (nullable GTMAppAuthFetcherAuthorization *)
    authorizeFromPersistenceString:(NSString *)persistenceString
                          tokenURL:(NSURL *)tokenURL
                       redirectURI:(NSString *)redirectURI
                          clientID:(NSString *)clientID
                      clientSecret:(nullable NSString *)clientSecret;

/*! @brief Removes stored tokens, such as when the user signs out.
    @param keychainItemName The keychain name.
    @return YES the tokens were removed successfully (or didn't exist).
 */
+ (BOOL)removeAuthFromKeychainForName:(NSString *)keychainItemName;

/*! @brief Saves the authorization state to the keychain, in a GTMOAuth2 compatible manner.
    @param keychainItemName The keychain name.
    @return YES when the state was saved successfully.
 */
+ (BOOL)saveAuthToKeychainForName:(NSString *)keychainItemName
                   authentication:(GTMAppAuthFetcherAuthorization *)auth
    __attribute__((deprecated(
        "Use GTMAppAuthFetcherAuthorization::saveAuthorization:toKeychainForName:")));

#if !GTM_OAUTH2_SKIP_GOOGLE_SUPPORT

/*! @brief Attempts to create a @c GTMAppAuthFetcherAuthorization from data stored in the keychain
        in GTMOAuth2 format, at the supplied keychain identifier. Uses Google OAuth provider
        information.
    @param keychainItemName The keychain name.
    @param clientID The OAuth client id.
    @param clientSecret The OAuth client secret.
    @return A @c GTMAppAuthFetcherAuthorization object, or nil.
 */
+ (nullable GTMAppAuthFetcherAuthorization *)
    authForGoogleFromKeychainForName:(NSString *)keychainItemName
                            clientID:(NSString *)clientID
                        clientSecret:(nullable NSString *)clientSecret;

/*! @brief Returns Google's OAuth 2.0 authorization endpoint.
    @return Returns Google's OAuth 2.0 authorization endpoint.
 */
+ (NSURL *)googleAuthorizationURL;

/*! @brief Returns Google's OAuth 2.0 token endpoint.
    @return Returns Google's OAuth 2.0 token endpoint.
 */
+ (NSURL *)googleTokenURL;

/*! @brief Returns Google's OAuth 2.0 revocation endpoint.
    @return Returns Google's OAuth 2.0 revocation endpoint.
 */
+ (NSURL *)googleRevocationURL;

/*! @brief Returns Google's OAuth 2.0 userinfo endpoint.
    @return Returns Google's OAuth 2.0 userinfo endpoint.
 */
+ (NSURL *)googleUserInfoURL;

/*! @brief Returns Google's native OOB redirect URI.
    @discussion This is a legacy redirect URI that was used with WebViews.
    @return Returns Google's native OOB redirect URI.
 */
+ (NSString *)nativeClientRedirectURI;

#endif // !GTM_OAUTH2_SKIP_GOOGLE_SUPPORT

@end

NS_ASSUME_NONNULL_END
