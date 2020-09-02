//
//  AMPURLConnection.m
//  Copyright (c) 2013 Amplitude Inc. (https://amplitude.com/)
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

#if AMPLITUDE_SSL_PINNING

#ifndef AMPLITUDE_DEBUG
#define AMPLITUDE_DEBUG 0
#endif

#ifndef AMPLITUDE_LOG
#if AMPLITUDE_DEBUG
#   define AMPLITUDE_LOG(fmt, ...) NSLog(fmt, ##__VA_ARGS__)
#else
#   define AMPLITUDE_LOG(...)
#endif
#endif

#import "AMPURLConnection.h"
#import "AMPConstants.h"
#import "ISPCertificatePinning.h"
#import "ISPPinnedNSURLConnectionDelegate.h"

@interface AMPURLConnection ()

@property (nonatomic, copy) void (^completionHandler)(NSURLResponse *, NSData *, NSError *);
@property (nonatomic, retain) NSURLConnection *connection;
@property (nonatomic, retain) NSMutableData *data;
@property (nonatomic, retain) NSURLResponse *response;
@property (nonatomic, retain) AMPURLConnection *delegate;

@end

@implementation AMPURLConnection

+ (void)initialize {
    if (self == [AMPURLConnection class]) {
        [AMPURLConnection pinSSLCertificate:@[@"ComodoRsaDomainValidationCA"]];
    }
}

+ (void)pinSSLCertificate:(NSArray *)certFilenames {
    // We pin the anchor/CA certificates
    NSMutableArray *certs = [NSMutableArray array];
    for (NSString *certFilename in certFilenames) {
        NSString *certPath =  [[NSBundle bundleForClass:[self class]] pathForResource:certFilename ofType:@"der"];
        NSData *certData = [[NSData alloc] initWithContentsOfFile:certPath];
        if (certData == nil) {
            AMPLITUDE_LOG(@"Failed to load a certificate");
            return;
        }
        [certs addObject:certData];
    }

    NSMutableDictionary *pins = [[NSMutableDictionary alloc] init];
    [pins setObject:certs forKey:kAMPEventLogDomain];

    if (pins == nil) {
        AMPLITUDE_LOG(@"Failed to pin a certificate");
        return;
    }

    // Save the SSL pins so that our connection delegates automatically use them
    if ([ISPCertificatePinning setupSSLPinsUsingDictionnary:pins] != YES) {
        AMPLITUDE_LOG(@"Failed to pin the certificates");
        return;
    }
}

/**
 * Instantiate a connection to run the request and handle the response.
 *
 * Emulates the +sendAsynchronous:queue:completionHandler method in NSURLConnection.
 * In order to have optional SSL pinning, a ISPPinnedNSURLConnectionDelegate was needed, so
 * the async method with callback wasn't sufficient.
 */
+ (void)sendAsynchronousRequest:(NSURLRequest *)request
                          queue:(NSOperationQueue *)queue
              completionHandler:(void (^)(NSURLResponse *response, NSData *data, NSError *connectionError))handler {
    // Ignore the return value. See note below about self retaining.
    (void)[[AMPURLConnection alloc] initWithRequest:request
                                              queue:queue
                                  completionHandler:handler];
}

- (AMPURLConnection *)initWithRequest:(NSURLRequest *)request
                                queue:(NSOperationQueue *)queue
                    completionHandler:(void (^)(NSURLResponse *response, NSData *data, NSError *connectionError))handler {

    if (self = [super init]) {
        self.completionHandler = handler;
        self.data = nil;
        self.response = nil;

        // Have to retain self so it's not deallocated after the connection
        // finishes, but before the completion handler runs and self gets
        // cleaned up. When instantiated by sendAsynchronousRequest, the instance
        // is really it's own owner. The NSUrlConnection holds a strong reference
        // to the instance as a delegate, but releases after the connection completes.
        self.delegate = self;

        _connection = [[NSURLConnection alloc] initWithRequest:request
                                                      delegate:self
                                              startImmediately:NO];

        [self.connection setDelegateQueue:queue];
        [self.connection start];
    }

    return self;
}

- (void)complete:(NSError *)error {
    self.completionHandler(self.response, self.data, error);
    self.delegate = nil;
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection {
    [self complete:nil];
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
    [self complete:error];
}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data {
    [self.data appendData:data];
}

- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response {
    self.response = response;
    _data = [[NSMutableData alloc] init];
}

@end
#endif
