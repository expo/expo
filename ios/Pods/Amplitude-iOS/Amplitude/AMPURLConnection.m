#if AMPLITUDE_SSL_PINNING
//
//  AMPURLConnection.m
//  Amplitude
//
//  Created by Allan on 3/13/15.
//  Copyright (c) 2015 Amplitude. All rights reserved.
//

#import "AMPURLConnection.h"
#import "AMPARCMacros.h"
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

+ (void)initialize
{
    if (self == [AMPURLConnection class]) {
        [AMPURLConnection pinSSLCertificate:@[@"ComodoRsaCA", @"ComodoRsaDomainValidationCA"]];
    }
}

+ (void)pinSSLCertificate:(NSArray *)certFilenames
{
    // We pin the anchor/CA certificates
    NSMutableArray *certs = [NSMutableArray array];
    for (NSString *certFilename in certFilenames) {
        NSString *certPath =  [[NSBundle bundleForClass:[self class]] pathForResource:certFilename ofType:@"der"];
        NSData *certData = SAFE_ARC_AUTORELEASE([[NSData alloc] initWithContentsOfFile:certPath]);
        if (certData == nil) {
            NSLog(@"Failed to load a certificate");
            return;
        }
        [certs addObject:certData];
    }

    NSMutableDictionary *pins = [[NSMutableDictionary alloc] init];
    [pins setObject:certs forKey:kAMPEventLogDomain];

    if (pins == nil) {
        NSLog(@"Failed to pin a certificate");
        return;
    }

    // Save the SSL pins so that our connection delegates automatically use them
    if ([ISPCertificatePinning setupSSLPinsUsingDictionnary:pins] != YES) {
        NSLog(@"Failed to pin the certificates");
        SAFE_ARC_RELEASE(pins);
        return;
    }
    SAFE_ARC_RELEASE(pins);
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
              completionHandler:(void (^)(NSURLResponse *response, NSData *data, NSError *connectionError))handler
{
    // Ignore the return value. See note below about self retaining.
    (void)[[AMPURLConnection alloc] initWithRequest:request
                                              queue:queue
                                  completionHandler:handler];
}

- (AMPURLConnection *)initWithRequest:(NSURLRequest *)request
                                queue:(NSOperationQueue *)queue
                    completionHandler:(void (^)(NSURLResponse *response, NSData *data, NSError *connectionError))handler
{

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

- (void)dealloc
{
    SAFE_ARC_RELEASE(_connection);
    SAFE_ARC_RELEASE(_completionHandler);
    SAFE_ARC_RELEASE(_data);
    SAFE_ARC_RELEASE(_response);
    SAFE_ARC_RELEASE(_delegate);
    SAFE_ARC_SUPER_DEALLOC();
}

- (void)complete:(NSError *)error
{
    self.completionHandler(self.response, self.data, error);

    // The instance has done it's work. Release thyself.
    SAFE_ARC_RELEASE(self);
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
