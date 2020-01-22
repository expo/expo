#if AMPLITUDE_SSL_PINNING
//
//  ISPCertificatePinning.m
//  SSLCertificatePinning
//
//  Created by Alban Diquet on 1/14/14.
//  Copyright (c) 2014 iSEC Partners. All rights reserved.
//

#import "ISPCertificatePinning.h"


// All the pinned certificate are stored in this plist on the filesystem
#define PINNED_KEYS_FILE_PATH "~/Library/SSLPins.plist"


@implementation ISPCertificatePinning



+ (BOOL)setupSSLPinsUsingDictionnary:(NSDictionary*)domainsAndCertificates {
    if (domainsAndCertificates == nil) {
        return NO;
    }

    // Serialize the dictionary to a plist
    NSError *error;
    NSData *plistData = [NSPropertyListSerialization dataWithPropertyList:domainsAndCertificates
                                                                   format:NSPropertyListXMLFormat_v1_0
                                                                  options:0
                                                                    error:&error];
    if (plistData == nil) {
        NSLog(@"Error serializing plist: %@", error);
        return NO;
    }

    // Write the plist to a pre-defined location on the filesystem
    NSError *writeError;
    if ([plistData writeToFile:[@PINNED_KEYS_FILE_PATH stringByExpandingTildeInPath]
                       options:NSDataWritingAtomic
                         error:&writeError] == NO) {
        NSLog(@"Error saving plist to the filesystem: %@", writeError);
        return NO;
    }

    return YES;
}


+ (BOOL)verifyPinnedCertificateForTrust:(SecTrustRef)trust andDomain:(NSString*)domain {
    if ((trust == NULL) || (domain == nil)) {
        return NO;
    }

    // Deserialize the plist that contains our SSL pins
    NSDictionary *SSLPinsDict = [NSDictionary dictionaryWithContentsOfFile:[@PINNED_KEYS_FILE_PATH stringByExpandingTildeInPath]];
    if (SSLPinsDict == nil) {
        NSLog(@"Error accessing the SSL Pins plist at %@", @PINNED_KEYS_FILE_PATH);
        return NO;
    }

    // Do we have certificates pinned for this domain ?
    NSArray *trustedCertificates = [SSLPinsDict objectForKey:domain];
    if ((trustedCertificates == nil) || ([trustedCertificates count] < 1)) {
        return NO;
    }

    // For each pinned certificate, check if it is part of the server's cert trust chain
    // We only need one of the pinned certificates to be in the server's trust chain
    for (NSData *pinnedCertificate in trustedCertificates) {

        // Check each certificate in the server's trust chain (the trust object)
        // Unfortunately the anchor/CA certificate cannot be accessed this way
        CFIndex certsNb = SecTrustGetCertificateCount(trust);
        for(int i=0;i<certsNb;i++) {

            // Extract the certificate
            SecCertificateRef certificate = SecTrustGetCertificateAtIndex(trust, i);
            NSData* DERCertificate = (__bridge NSData*) SecCertificateCopyData(certificate);

            // Compare the two certificates
            if ([pinnedCertificate isEqualToData:DERCertificate]) {
                CFRelease((__bridge CFTypeRef)DERCertificate);
                return YES;
            }
            CFRelease((__bridge CFTypeRef)DERCertificate);
        }

        // Check the anchor/CA certificate separately
        SecCertificateRef anchorCertificate = SecCertificateCreateWithData(NULL, (__bridge CFDataRef)(pinnedCertificate));
        if (anchorCertificate == NULL) {
            break;
        }

        NSArray *anchorArray = [NSArray arrayWithObject:(__bridge id)(anchorCertificate)];
        if (SecTrustSetAnchorCertificates(trust, (__bridge CFArrayRef)(anchorArray)) != 0) {
            CFRelease(anchorCertificate);
            break;
        }

        SecTrustResultType trustResult;
        SecTrustEvaluate(trust, &trustResult);
        if (trustResult == kSecTrustResultUnspecified) {
            // The anchor certificate was pinned
            CFRelease(anchorCertificate);
            return YES;
        }
        CFRelease(anchorCertificate);
    }

    // If we get here, we didn't find any matching certificate in the chain
    return NO;
}

@end
#endif
