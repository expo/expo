#if AMPLITUDE_SSL_PINNING
//
//  ISPPinnedNSURLConnectionDelegate.m
//  SSLCertificatePinning
//
//  Created by Alban Diquet on 1/14/14.
//  Copyright (c) 2014 iSEC Partners. All rights reserved.
//

#import "ISPPinnedNSURLConnectionDelegate.h"
#import "ISPCertificatePinning.h"


@implementation ISPPinnedNSURLConnectionDelegate


- (void)connection:(NSURLConnection *)connection willSendRequestForAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge {

    if([challenge.protectionSpace.authenticationMethod isEqualToString:NSURLAuthenticationMethodServerTrust]) {

        SecTrustRef serverTrust = [[challenge protectionSpace] serverTrust];
        NSString *domain = [[challenge protectionSpace] host];
        SecTrustResultType trustResult;

        // Validate the certificate chain with the device's trust store anyway
        // This *might* give use revocation checking
        SecTrustEvaluate(serverTrust, &trustResult);
        if (trustResult == kSecTrustResultUnspecified) {

            // Look for a pinned certificate in the server's certificate chain
            if ([ISPCertificatePinning verifyPinnedCertificateForTrust:serverTrust andDomain:domain]) {

                // Found the certificate; continue connecting
                [challenge.sender useCredential:[NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust]
                     forAuthenticationChallenge:challenge];
            }
            else {
                // The certificate wasn't found in the certificate chain; cancel the connection
                [[challenge sender] cancelAuthenticationChallenge: challenge];
            }
        }
        else {
            // Certificate chain validation failed; cancel the connection
            [[challenge sender] cancelAuthenticationChallenge: challenge];
        }
    }
}


@end
#endif
