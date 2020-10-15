/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef FB_SONARKIT_ENABLED

#import <Flipper/FlipperCertificateExchangeMedium.h>

typedef enum FlipperCertificateExchangeMedium
    FlipperKitCertificateExchangeMedium;
/**
Represents a CPP Certificate Provider to be used by FlipperClient
*/
@protocol FlipperKitCertificateProvider<NSObject>

- (_Nonnull instancetype)initCPPCertificateProvider;

- (void* _Nonnull)
    getCPPCertificateProvider; // Returning it as void* as the file needs to
                               // have no cpp for it to be compatible with
                               // Swift. The pointer returned should point to
                               // std::shared_ptr<FlipperCertificateProvider>
- (void)setCertificateExchangeMedium:
    (FlipperKitCertificateExchangeMedium)medium;

@optional
- (void)setAuthToken:(nullable NSString*)authToken;
@end

#endif
