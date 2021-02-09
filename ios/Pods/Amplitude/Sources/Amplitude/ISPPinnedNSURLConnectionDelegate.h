//
//  ISPPinnedNSURLConnectionDelegate.h
//  SSLCertificatePinning
//
//  Created by Alban Diquet on 1/14/14.
//  Copyright (c) 2014 iSEC Partners. All rights reserved.
//

#if AMPLITUDE_SSL_PINNING

#import <Foundation/Foundation.h>

/** Convenience class to automatically perform certificate pinning for NSURLConnection.

 ISPPinnedNSURLConnectionDelegate is designed to be subclassed in order to
 implement an NSURLConnectionDelegate class. The
 connection:willSendRequestForAuthenticationChallenge: method it implements
 will automatically validate that at least one the certificates pinned to the domain the
 connection is accessing is part of the server's certificate chain.

 */
@interface ISPPinnedNSURLConnectionDelegate : NSObject

- (void)connection:(NSURLConnection *)connection willSendRequestForAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge;

@end
#endif
