#if AMPLITUDE_SSL_PINNING
//
//  ISPCertificatePinning.h
//  SSLCertificatePinning v3
//
//  Created by Alban Diquet on 1/14/14.
//  Copyright (c) 2014 iSEC Partners. All rights reserved.
//

#import <Foundation/Foundation.h>

/** This class implements certificate pinning utility functions.

 First, the certificates and domains to pin should be loaded using
 setupSSLPinsUsingDictionnary:. This method will store them in
 "~/Library/SSLPins.plist".

 Then, the verifyPinnedCertificateForTrust:andDomain: method can be
 used to validate that at least one the certificates pinned to a
 specific domain is in the server's certificate chain when connecting to
 it. This method should be used for example in the
 connection:willSendRequestForAuthenticationChallenge: method of the
 NSURLConnectionDelegate object that is used to perform the connection.

 Alternatively, the ISPPinnedNSURLSessionDelegate or
 ISPPinnedNSURLConnectionDelegate classes can be directly used
 to create a delegate class performing certificate pinning.

 */

@interface ISPCertificatePinning : NSObject


/**
 Certificate pinning loading method

 This method takes a dictionary with domain names as keys and arrays of DER-
 encoded certificates as values, and stores them in a pre-defined location on
 the filesystem. The ability to specify multiple certificates for a single
 domain is useful when transitioning from an expiring certificate to a new one.

 @param certificates a dictionnary with domain names as keys and arrays of DER-encoded certificates as values
 @return BOOL successfully loaded the public keys and domains

 */
+ (BOOL)setupSSLPinsUsingDictionnary:(NSDictionary*)domainsAndCertificates;


/**
 Certificate pinning validation method

 This method accesses the certificates previously loaded using the
 setupSSLPinsUsingDictionnary: method and inspects the trust object's
 certificate chain in order to find at least one certificate pinned to the
 given domain. SecTrustEvaluate() should always be called before this method to
 ensure that the certificate chain is valid.

 @param trust the trust object whose certificate chain must contain the certificate previously pinned to the given domain
 @param domain the domain we're trying to connect to
 @return BOOL found the domain's pinned certificate in the trust object's certificate chain

 */
+ (BOOL)verifyPinnedCertificateForTrust:(SecTrustRef)trust andDomain:(NSString*)domain;

@end
#endif
