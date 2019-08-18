//
//  BNCServerRequestQueue.m
//  Branch-SDK
//
//  Created by Qinwei Gong on 9/6/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//


#import "BNCServerRequestQueue.h"
#import "BNCPreferenceHelper.h"
#import "BranchCloseRequest.h"
#import "BranchOpenRequest.h"
#import "BNCLog.h"


static NSString * const BRANCH_QUEUE_FILE = @"BNCServerRequestQueue";
static NSTimeInterval const BATCH_WRITE_TIMEOUT = 3.0;


static inline uint64_t BNCNanoSecondsFromTimeInterval(NSTimeInterval interval) {
    return interval * ((NSTimeInterval) NSEC_PER_SEC);
}


@interface BNCServerRequestQueue()
@property (strong) NSMutableArray *queue;
@property (strong) dispatch_queue_t asyncQueue;
@property (strong) dispatch_source_t persistTimer;
@end


@implementation BNCServerRequestQueue

- (id)init {
    self = [super init];
    if (!self) return self;

    self.queue = [NSMutableArray array];
    self.asyncQueue = dispatch_queue_create("io.branch.persist_queue", DISPATCH_QUEUE_SERIAL);
    return self;
}

- (void) dealloc {
    @synchronized (self) {
        if (self.persistTimer) {
            dispatch_source_cancel(self.persistTimer);
            self.persistTimer = nil;
        }
        [self persistImmediately];
        self.queue = nil;
    }
}

- (void)enqueue:(BNCServerRequest *)request {
    @synchronized (self) {
        if (request) {
            [self.queue addObject:request];
            [self persistEventually];
        }
    }
}

- (void)insert:(BNCServerRequest *)request at:(NSUInteger)index {
    @synchronized (self) {
        if (index > self.queue.count) {
            BNCLogError(@"Invalid queue operation: index out of bound!");
            return;
        }
        if (request) {
            [self.queue insertObject:request atIndex:index];
            [self persistEventually];
        }
    }
}

- (BNCServerRequest *)dequeue {
    @synchronized (self) {
        BNCServerRequest *request = nil;
        if (self.queue.count > 0) {
            request = [self.queue objectAtIndex:0];
            [self.queue removeObjectAtIndex:0];
            [self persistEventually];
        }
        return request;
    }
}

- (BNCServerRequest *)removeAt:(NSUInteger)index {
    @synchronized (self) {
        BNCServerRequest *request = nil;
        if (index >= self.queue.count) {
            BNCLogError(@"Invalid queue operation: index out of bound!");
            return nil;
        }
        request = [self.queue objectAtIndex:index];
        [self.queue removeObjectAtIndex:index];
        [self persistEventually];
        return request;
    }
}

- (void)remove:(BNCServerRequest *)request {
    @synchronized (self) {
        [self.queue removeObject:request];
        [self persistEventually];
    }
}

- (BNCServerRequest *)peek {
    @synchronized (self) {
        return [self peekAt:0];
    }
}

- (BNCServerRequest *)peekAt:(NSUInteger)index {
    @synchronized (self) {
        if (index >= self.queue.count) {
            BNCLogError(@"Invalid queue operation: index out of bound!");
            return nil;
        }
        BNCServerRequest *request = nil;
        request = [self.queue objectAtIndex:index];
        return request;
    }
}

- (NSInteger)queueDepth {
    @synchronized (self) {
        return (NSInteger) self.queue.count;
    }
}

- (NSString *)description {
    @synchronized(self) {
        return [self.queue description];
    }
}

- (void)clearQueue {
    @synchronized (self) {
        [self.queue removeAllObjects];
        [self persistImmediately];
    }
}

- (BOOL)containsInstallOrOpen {
    @synchronized (self) {
        for (NSUInteger i = 0; i < self.queue.count; i++) {
            BNCServerRequest *req = [self.queue objectAtIndex:i];
            // Install extends open, so only need to check open.
            if ([req isKindOfClass:[BranchOpenRequest class]]) {
                return YES;
            }
        }
        return NO;
    }
}

- (BOOL)removeInstallOrOpen {
    @synchronized (self) {
        for (NSUInteger i = 0; i < self.queue.count; i++) {
            BranchOpenRequest *req = [self.queue objectAtIndex:i];
            // Install extends open, so only need to check open.
            if ([req isKindOfClass:[BranchOpenRequest class]]) {
                BNCLogDebugSDK(@"Removing open request.");
                req.callback = nil;
                [self remove:req];
                return YES;
            }
        }
        return NO;
    }
}

- (BranchOpenRequest *)moveInstallOrOpenToFront:(NSInteger)networkCount {
    @synchronized (self) {

        BOOL requestAlreadyInProgress = networkCount > 0;

        BNCServerRequest *openOrInstallRequest;
        for (NSUInteger i = 0; i < self.queue.count; i++) {
            BNCServerRequest *req = [self.queue objectAtIndex:i];
            if ([req isKindOfClass:[BranchOpenRequest class]]) {
                
                // Already in front, nothing to do
                if (i == 0 || (i == 1 && requestAlreadyInProgress)) {
                    return (BranchOpenRequest *)req;
                }

                // Otherwise, pull this request out and stop early
                openOrInstallRequest = [self removeAt:i];
                break;
            }
        }
        
        if (!openOrInstallRequest) {
            BNCLogError(@"No install or open request in queue while trying to move it to the front.");
            return nil;
        }
        
        if (!requestAlreadyInProgress || !self.queue.count) {
            [self insert:openOrInstallRequest at:0];
        }
        else {
            [self insert:openOrInstallRequest at:1];
        }
        
        return (BranchOpenRequest *)openOrInstallRequest;
    }
}

- (BOOL)containsClose {
    @synchronized (self) {
        for (NSUInteger i = 0; i < self.queue.count; i++) {
            BNCServerRequest *req = [self.queue objectAtIndex:i];
            if ([req isKindOfClass:[BranchCloseRequest class]]) {
                return YES;
            }
        }
        return NO;
    }
}

#pragma mark - Private Methods

- (void)persistEventually {
    @synchronized (self) {
        if (self.persistTimer) return;

        self.persistTimer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, self.asyncQueue);
        if (!self.persistTimer) return;

        dispatch_time_t startTime =
            dispatch_time(DISPATCH_TIME_NOW, BNCNanoSecondsFromTimeInterval(BATCH_WRITE_TIMEOUT));
        dispatch_source_set_timer(
            self.persistTimer,
            startTime,
            BNCNanoSecondsFromTimeInterval(BATCH_WRITE_TIMEOUT),
            BNCNanoSecondsFromTimeInterval(BATCH_WRITE_TIMEOUT / 10.0)
        );
        __weak __typeof(self) weakSelf = self;
        dispatch_source_set_event_handler(self.persistTimer, ^ {
            __strong __typeof(weakSelf) strongSelf = weakSelf;
            if (strongSelf) {
                [strongSelf cancelTimer];
                [strongSelf persistImmediately];
            }
        });
        dispatch_resume(self.persistTimer);
    }
}

- (void) cancelTimer {
    @synchronized (self) {
        if (self.persistTimer) {
            dispatch_source_cancel(self.persistTimer);
            self.persistTimer = nil;
        }
    }
}

- (void)persistImmediately {
    @synchronized (self) {
        @try {
            if (!self.queue) return;
            NSArray *requestsToPersist = [self.queue copy];
            NSMutableArray *encodedRequests = [[NSMutableArray alloc] init];
            for (BNCServerRequest *req in requestsToPersist) {
                // Don't persist these requests
                if ([req isKindOfClass:[BranchCloseRequest class]]) {
                    continue;
                }
                NSData *encodedReq = [NSKeyedArchiver archivedDataWithRootObject:req];
                if (encodedReq) [encodedRequests addObject:encodedReq];
            }
            NSData *data = [NSKeyedArchiver archivedDataWithRootObject:encodedRequests];
            if (!data) {
                BNCLogError(@"Cannot create archive data.");
                return;
            }
            NSError *error = nil;
            [data writeToURL:self.class.URLForQueueFile
                options:NSDataWritingAtomic error:&error];
            if (error) {
                BNCLogError(@"Failed to persist queue to disk: %@.", error);
            }
        }
        @catch (NSException *exception) {
            BNCLogError(
                @"An exception occurred while attempting to save the queue. Exception information:\n\n%@.",
                [self.class exceptionString:exception]
            );
        }
    }
}

- (BOOL) isDirty {
    @synchronized (self) {
        return (self.persistTimer != nil);
    }
}

- (void)retrieve {
    @synchronized (self) {
        NSMutableArray *queue = [[NSMutableArray alloc] init];
        NSArray *encodedRequests = nil;
        
        // Capture exception while loading the queue file
        @try {
            NSError *error = nil;
            NSData *data = [NSData dataWithContentsOfURL:self.class.URLForQueueFile options:0 error:&error];
            if ([error.domain isEqualToString:NSCocoaErrorDomain] && error.code == NSFileReadNoSuchFileError) {
                encodedRequests = [NSArray new];
            } else if (!error && data)
                encodedRequests = [NSKeyedUnarchiver unarchiveObjectWithData:data];
            if (![encodedRequests isKindOfClass:[NSArray class]]) {
                @throw [NSException exceptionWithName:NSInvalidArgumentException
                    reason:@"Saved server queue is invalid." userInfo:nil];
            }
        }
        @catch (NSException *exception) {
            BNCLogError(
                @"An exception occurred while attempting to load the queue file, "
                "proceeding without requests. Exception information:\n\n%@.",
                [self.class exceptionString:exception]
            );
            self.queue = queue;
            return;
        }

        for (NSData *encodedRequest in encodedRequests) {
            BNCServerRequest *request;

            // Capture exceptions while parsing individual request objects
            @try {
                request = [NSKeyedUnarchiver unarchiveObjectWithData:encodedRequest];
            }
            @catch (NSException*) {
                BNCLogWarning(@"An exception occurred while attempting to parse a queued request, discarding.");
                continue;
            }
            
            // Throw out invalid request types
            if (![request isKindOfClass:[BNCServerRequest class]]) {
                BNCLogWarning(@"Found an invalid request object, discarding. Object is: %@.", request);
                continue;
            }
            
            // Throw out persisted close requests
            if ([request isKindOfClass:[BranchCloseRequest class]]) {
                continue;
            }

            [queue addObject:request];
        }
        
        self.queue = queue;
    }
}

+ (NSString *)exceptionString:(NSException *)exception {
    return [NSString stringWithFormat:@"Name: %@\nReason: %@\nStack:\n\t%@\n\n",
        exception.name, exception.reason,
            [exception.callStackSymbols componentsJoinedByString:@"\n\t"]];
}

+ (NSString *)queueFile_deprecated {
    NSString *path =
        [[NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES)
            firstObject]
                stringByAppendingPathComponent:BRANCH_QUEUE_FILE];
    return path;
}

+ (NSURL* _Nonnull) URLForQueueFile {
    NSURL *URL = BNCURLForBranchDirectory();
    URL = [URL URLByAppendingPathComponent:BRANCH_QUEUE_FILE isDirectory:NO];
    return URL;
}

+ (void) moveOldQueueFile {
    NSURL *oldURL = [NSURL fileURLWithPath:self.queueFile_deprecated];
    NSURL *newURL = [self URLForQueueFile];
    
    if (!oldURL || !newURL) { return; }
    
    NSError *error = nil;
    [[NSFileManager defaultManager]
        moveItemAtURL:oldURL
        toURL:newURL
        error:&error];

    if (error && error.code != NSFileNoSuchFileError) {
        if (error.code == NSFileWriteFileExistsError) {
            [[NSFileManager defaultManager]
                removeItemAtURL:oldURL
                error:&error];
        } else {
            BNCLogError(@"Failed to move the queue file: %@.", error);
        }
    }
}

+ (void) initialize {
    if (self == [BNCServerRequestQueue self]) {
        [self moveOldQueueFile];
    }
}

#pragma mark - Shared Method

+ (id)getInstance {
    static BNCServerRequestQueue *sharedQueue = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^ {
        sharedQueue = [[BNCServerRequestQueue alloc] init];
        [sharedQueue retrieve];
        BNCLogDebugSDK(@"Retrieved from storage: %@.", sharedQueue);
    });
    return sharedQueue;
}

@end
