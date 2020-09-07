//
//  AMPConfigManager.m
//  Copyright (c) 2020 Amplitude Inc. (https://amplitude.com/)
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

#import "AMPConfigManager.h"
#import "AMPConstants.h"

@interface AMPConfigManager()

@property (nonatomic, strong, readwrite) NSString* ingestionEndpoint;

@end

@implementation AMPConfigManager

+ (instancetype)sharedInstance {
    static id instance;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[self alloc] init];
    });
    return instance;
}

- (instancetype)init {
    if ((self = [super init])) {
        self.ingestionEndpoint = kAMPEventLogUrl;
    }
    return self;
}

- (void)refresh:(void(^)(void))completionHandler {
    NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:kAMPDyanmicConfigUrl]];

    NSURLSession *session = [NSURLSession sharedSession];
    NSURLSessionDataTask *task = [session dataTaskWithRequest:request
                                            completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        if (!error) {
            NSError *jsonError = nil;
            NSDictionary *dictionary = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&jsonError];
            NSString *urlString = [dictionary objectForKey:@"ingestionEndpoint"];
            if (urlString) {
                NSString *ingestionEndpoint = [NSString stringWithFormat:@"https://%@", urlString];
                
                NSURL *url = [NSURL URLWithString: ingestionEndpoint];
                if (url && url.scheme && url.host) {
                    self.ingestionEndpoint = ingestionEndpoint;
                }
            }
        } else {
            // Error
        }
        
        completionHandler();
    }];
    [task resume];
}

@end
