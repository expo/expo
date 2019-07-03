/**
 @file          BNCURLBlackList.m
 @package       Branch-SDK
 @brief         Manages a list of URLs that we should ignore.

 @author        Edward Smith
 @date          February 14, 2018
 @copyright     Copyright © 2018 Branch. All rights reserved.
*/

#import "BNCURLBlackList.h"
#import "Branch.h"

@interface BNCURLBlackList () {
    NSArray<NSString*>*_blackList;
}
@property (strong) NSArray<NSRegularExpression*> *blackListRegex;
@property (assign) NSInteger blackListVersion;
@property (strong) id<BNCNetworkServiceProtocol> networkService;
@property (assign) BOOL hasRefreshedBlackListFromServer;
@property (strong) NSError *error;
@property (strong) NSURL *blackListJSONURL;
@end

@implementation BNCURLBlackList

- (instancetype) init {
    self = [super init];
    if (!self) return self;

    self.blackList = @[
        @"^fb\\d+:",
        @"^li\\d+:",
        @"^pdk\\d+:",
        @"^twitterkit-.*:",
        @"^com\\.googleusercontent\\.apps\\.\\d+-.*:\\/oauth",
        @"^(?i)(?!(http|https):).*(:|:.*\\b)(password|o?auth|o?auth.?token|access|access.?token)\\b",
        @"^(?i)((http|https):\\/\\/).*[\\/|?|#].*\\b(password|o?auth|o?auth.?token|access|access.?token)\\b",
    ];
    self.blackListVersion = -1; // First time always refresh the list version, version 0.

    NSArray *storedList = [BNCPreferenceHelper preferenceHelper].URLBlackList;
    if (storedList.count > 0) {
        self.blackList = storedList;
        self.blackListVersion = [BNCPreferenceHelper preferenceHelper].URLBlackListVersion;
    }

    NSError *error = nil;
    _blackListRegex = [self.class compileRegexArray:self.blackList error:&error];
    self.error = error;

    return self;
}

- (void) dealloc {
    [self.networkService cancelAllOperations];
    self.networkService = nil;
}

- (void) setBlackList:(NSArray<NSString *> *)blackList {
    @synchronized (self) {
        _blackList = blackList;
        _blackListRegex = [self.class compileRegexArray:_blackList error:nil];
    }
}

- (NSArray<NSString*>*) blackList {
    @synchronized (self) {
        return _blackList;
    }
}

+ (NSArray<NSRegularExpression*>*) compileRegexArray:(NSArray<NSString*>*)blacklist
                                               error:(NSError*_Nullable __autoreleasing *_Nullable)error_ {
    if (error_) *error_ = nil;
    NSMutableArray *array = [NSMutableArray new];
    for (NSString *pattern in blacklist) {
        NSError *error = nil;
        NSRegularExpression *regex =
            [NSRegularExpression regularExpressionWithPattern:pattern
                options: NSRegularExpressionAnchorsMatchLines | NSRegularExpressionUseUnicodeWordBoundaries
                error:&error];
        if (error || !regex) {
            BNCLogError(@"Invalid regular expression '%@': %@.", pattern, error);
            if (error_ && !*error_) *error_ = error;
        } else {
            [array addObject:regex];
        }
    }
    return array;
}

- (NSString*_Nullable) blackListPatternMatchingURL:(NSURL*_Nullable)url {
    NSString *urlString = url.absoluteString;
    if (urlString == nil || urlString.length <= 0) return nil;
    NSRange range = NSMakeRange(0, urlString.length);

    for (NSRegularExpression* regex in self.blackListRegex) {
        NSUInteger matches = [regex numberOfMatchesInString:urlString options:0 range:range];
        if (matches > 0) return regex.pattern;
    }

    return nil;
}

- (BOOL) isBlackListedURL:(NSURL *)url {
    return ([self blackListPatternMatchingURL:url]) ? YES : NO;
}

- (void) refreshBlackListFromServer {
    [self refreshBlackListFromServerWithCompletion:nil];
}

- (void) refreshBlackListFromServerWithCompletion:(void (^) (NSError*error, NSArray*list))completion {
    @synchronized(self) {
        if (self.hasRefreshedBlackListFromServer) {
            if (completion) completion(self.error, self.blackList);
            return;
        }
        self.hasRefreshedBlackListFromServer = YES;
    }

    self.error = nil;
    NSString *urlString = [self.blackListJSONURL absoluteString];
    if (!urlString) {
        urlString = [NSString stringWithFormat:@"https://cdn.branch.io/sdk/uriskiplist_v%ld.json",
            (long) self.blackListVersion+1];
    }
    NSMutableURLRequest *request =
        [NSMutableURLRequest requestWithURL:[NSURL URLWithString:urlString]
            cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
            timeoutInterval:30.0];

    self.networkService = [[Branch networkServiceClass] new];
    id<BNCNetworkOperationProtocol> operation =
        [self.networkService networkOperationWithURLRequest:request completion:
            ^(id<BNCNetworkOperationProtocol> operation) {
                [self processServerOperation:operation];
                if (completion) completion(self.error, self.blackList);
                [self.networkService cancelAllOperations];
                self.networkService = nil;
            }
        ];
    [operation start];
}

- (void) processServerOperation:(id<BNCNetworkOperationProtocol>)operation {
    NSError *error = nil;
    NSString *responseString = nil;
    if (operation.responseData)
        responseString = [[NSString alloc] initWithData:operation.responseData encoding:NSUTF8StringEncoding];
    if (operation.response.statusCode == 404) {
        BNCLogDebugSDK(@"No new BlackList refresh found.");
    } else {
        BNCLogDebugSDK(@"BlackList refresh result. Error: %@ status: %ld body:\n%@.",
            operation.error, (long)operation.response.statusCode, responseString);
    }
    if (operation.error || operation.responseData == nil || operation.response.statusCode != 200) {
        self.error = operation.error;
        return;
    }

    NSDictionary *dictionary = [NSJSONSerialization JSONObjectWithData:operation.responseData options:0 error:&error];
    if (error) {
        self.error = error;
        BNCLogError(@"Can't parse JSON: %@.", error);
        return;
    }

    NSArray *blackListURLs = dictionary[@"uri_skip_list"];
    if (![blackListURLs isKindOfClass:NSArray.class]) return;

    NSNumber *blackListVersion = dictionary[@"version"];
    if (![blackListVersion isKindOfClass:NSNumber.class]) return;

    self.blackList = blackListURLs;
    self.blackListVersion = [blackListVersion longValue];
    [BNCPreferenceHelper preferenceHelper].URLBlackList = self.blackList;
    [BNCPreferenceHelper preferenceHelper].URLBlackListVersion = self.blackListVersion;
}

@end
