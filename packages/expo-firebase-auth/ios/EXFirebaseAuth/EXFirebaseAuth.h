// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <Firebase.h>
#import <EXCore/EXModuleRegistry.h>
#import <EXCore/EXModuleRegistryConsumer.h>
#import <EXCore/EXEventEmitter.h>

@interface EXFirebaseAuth: EXExportedModule <EXModuleRegistryConsumer, EXEventEmitter>

@end

NSString * const AuthErrorCode_toJSErrorCode[] = {
  [FIRAuthErrorCodeInvalidCustomToken] = @"auth/invalid-custom-token",
  [FIRAuthErrorCodeCustomTokenMismatch] = @"auth/custom-token-mismatch",
  [FIRAuthErrorCodeInvalidCredential] = @"auth/invalid-credential",
  [FIRAuthErrorCodeUserDisabled] = @"auth/user-disabled",
  [FIRAuthErrorCodeOperationNotAllowed] = @"auth/operation-not-allowed",
  [FIRAuthErrorCodeEmailAlreadyInUse] = @"auth/email-already-in-use",
  [FIRAuthErrorCodeInvalidEmail] = @"auth/invalid-email",
  [FIRAuthErrorCodeWrongPassword] = @"auth/wrong-password",
  [FIRAuthErrorCodeTooManyRequests] = @"auth/too-many-requests",
  [FIRAuthErrorCodeUserNotFound] = @"auth/user-not-found",
  [FIRAuthErrorCodeAccountExistsWithDifferentCredential] = @"auth/account-exists-with-different-credential",
  [FIRAuthErrorCodeRequiresRecentLogin] = @"auth/requires-recent-login",
  [FIRAuthErrorCodeProviderAlreadyLinked] = @"auth/provider-already-linked",
  [FIRAuthErrorCodeNoSuchProvider] = @"auth/no-such-provider",
  [FIRAuthErrorCodeInvalidUserToken] = @"auth/invalid-user-token",
  [FIRAuthErrorCodeNetworkError] = @"auth/network-request-failed",
  [FIRAuthErrorCodeUserTokenExpired] = @"auth/user-token-expired",
  [FIRAuthErrorCodeInvalidAPIKey] = @"auth/invalid-api-key",
  [FIRAuthErrorCodeUserMismatch] = @"auth/user-mismatch",
  [FIRAuthErrorCodeCredentialAlreadyInUse] = @"auth/credential-already-in-use",
  [FIRAuthErrorCodeWeakPassword] = @"auth/weak-password",
  [FIRAuthErrorCodeAppNotAuthorized] = @"auth/app-not-authorized",
  [FIRAuthErrorCodeExpiredActionCode] = @"auth/expired-action-code",
  [FIRAuthErrorCodeInvalidActionCode] = @"auth/invalid-action-code",
  [FIRAuthErrorCodeInvalidMessagePayload] = @"auth/invalid-message-payload",
  [FIRAuthErrorCodeInvalidSender] = @"auth/invalid-sender",
  [FIRAuthErrorCodeInvalidRecipientEmail] = @"auth/invalid-recipient-email",
  [FIRAuthErrorCodeMissingEmail] = @"auth/invalid-email",
  [FIRAuthErrorCodeMissingIosBundleID] = @"auth/missing-ios-bundle-id",
  [FIRAuthErrorCodeMissingAndroidPackageName] = @"auth/missing-android-pkg-name",
  [FIRAuthErrorCodeUnauthorizedDomain] = @"auth/unauthorized-domain",
  [FIRAuthErrorCodeInvalidContinueURI] = @"auth/invalid-continue-uri",
  [FIRAuthErrorCodeMissingContinueURI] = @"auth/missing-continue-uri",
  [FIRAuthErrorCodeMissingPhoneNumber] = @"auth/missing-phone-number",
  [FIRAuthErrorCodeInvalidPhoneNumber] = @"auth/invalid-phone-number",
  [FIRAuthErrorCodeMissingVerificationCode] = @"auth/missing-verification-code",
  [FIRAuthErrorCodeInvalidVerificationCode] = @"auth/invalid-verification-code",
  [FIRAuthErrorCodeMissingVerificationID] = @"auth/missing-verification-id",
  [FIRAuthErrorCodeInvalidVerificationID] = @"auth/invalid-verification-id",
  [FIRAuthErrorCodeMissingAppCredential] = @"auth/missing-app-credential",
  [FIRAuthErrorCodeInvalidAppCredential] = @"auth/invalid-app-credential",
  [FIRAuthErrorCodeSessionExpired] = @"auth/code-expired",
  [FIRAuthErrorCodeQuotaExceeded] = @"auth/quota-exceeded",
  [FIRAuthErrorCodeMissingAppToken] = @"auth/missing-apns-token",
  [FIRAuthErrorCodeNotificationNotForwarded] = @"auth/notification-not-forwarded",
  [FIRAuthErrorCodeAppNotVerified] = @"auth/app-not-verified",
  [FIRAuthErrorCodeCaptchaCheckFailed] = @"auth/captcha-check-failed",
  [FIRAuthErrorCodeWebContextAlreadyPresented] = @"auth/cancelled-popup-request",
  [FIRAuthErrorCodeWebContextCancelled] = @"auth/popup-closed-by-user",
  [FIRAuthErrorCodeAppVerificationUserInteractionFailure] = @"auth/app-verification-user-interaction-failure",
  [FIRAuthErrorCodeInvalidClientID] = @"auth/invalid-oauth-client-id",
  [FIRAuthErrorCodeWebNetworkRequestFailed] = @"auth/network-request-failed",
  [FIRAuthErrorCodeWebInternalError] = @"auth/internal-error",
  [FIRAuthErrorCodeNullUser] = @"auth/null-user",
  [FIRAuthErrorCodeKeychainError] = @"auth/keychain-error",
  [FIRAuthErrorCodeInternalError] = @"auth/internal-error",
  [FIRAuthErrorCodeMalformedJWT] = @"auth/malformed-jwt"
};

