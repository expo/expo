/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

//
//  FLEXNetworkObserver.m
//  Derived from:
//
//  PDAFNetworkDomainController.m
//  PonyDebugger
//
//  Created by Mike Lewis on 2/27/12.
//
//  Licensed to Square, Inc. under one or more contributor license agreements.
//  See the LICENSE file distributed with this work for the terms under
//  which Square, Inc. licenses this file to you.
//

#import "FLEXNetworkObserver.h"

#import <objc/message.h>
#import <objc/runtime.h>

#import <dispatch/queue.h>

#import "FLEXNetworkRecorder.h"
#import "FLEXUtility.h"

NSString* const kFLEXNetworkObserverEnabledStateChangedNotification =
    @"kFLEXNetworkObserverEnabledStateChangedNotification";
static NSString* const kFLEXNetworkObserverEnabledDefaultsKey =
    @"com.flex.FLEXNetworkObserver.enableOnLaunch";

typedef void (^NSURLSessionAsyncCompletion)(
    id fileURLOrData,
    NSURLResponse* response,
    NSError* error);

@interface FLEXInternalRequestState : NSObject

@property(nonatomic, copy) NSURLRequest* request;
@property(nonatomic, strong) NSMutableData* dataAccumulator;

@end

@implementation FLEXInternalRequestState

@end

@interface FLEXNetworkObserver (NSURLConnectionHelpers)

- (void)connection:(NSURLConnection*)connection
     willSendRequest:(NSURLRequest*)request
    redirectResponse:(NSURLResponse*)response
            delegate:(id<NSURLConnectionDelegate>)delegate;
- (void)connection:(NSURLConnection*)connection
    didReceiveResponse:(NSURLResponse*)response
              delegate:(id<NSURLConnectionDelegate>)delegate;

- (void)connection:(NSURLConnection*)connection
    didReceiveData:(NSData*)data
          delegate:(id<NSURLConnectionDelegate>)delegate;

- (void)connectionDidFinishLoading:(NSURLConnection*)connection
                          delegate:(id<NSURLConnectionDelegate>)delegate;
- (void)connection:(NSURLConnection*)connection
    didFailWithError:(NSError*)error
            delegate:(id<NSURLConnectionDelegate>)delegate;

- (void)connectionWillCancel:(NSURLConnection*)connection;

@end

@interface FLEXNetworkObserver (NSURLSessionTaskHelpers)

- (void)URLSession:(NSURLSession*)session
                          task:(NSURLSessionTask*)task
    willPerformHTTPRedirection:(NSHTTPURLResponse*)response
                    newRequest:(NSURLRequest*)request
             completionHandler:(void (^)(NSURLRequest*))completionHandler
                      delegate:(id<NSURLSessionDelegate>)delegate;
- (void)URLSession:(NSURLSession*)session
              dataTask:(NSURLSessionDataTask*)dataTask
    didReceiveResponse:(NSURLResponse*)response
     completionHandler:(void (^)(NSURLSessionResponseDisposition disposition))
                           completionHandler
              delegate:(id<NSURLSessionDelegate>)delegate;
- (void)URLSession:(NSURLSession*)session
          dataTask:(NSURLSessionDataTask*)dataTask
    didReceiveData:(NSData*)data
          delegate:(id<NSURLSessionDelegate>)delegate;
- (void)URLSession:(NSURLSession*)session
                 dataTask:(NSURLSessionDataTask*)dataTask
    didBecomeDownloadTask:(NSURLSessionDownloadTask*)downloadTask
                 delegate:(id<NSURLSessionDelegate>)delegate;
- (void)URLSession:(NSURLSession*)session
                    task:(NSURLSessionTask*)task
    didCompleteWithError:(NSError*)error
                delegate:(id<NSURLSessionDelegate>)delegate;
- (void)URLSession:(NSURLSession*)session
                 downloadTask:(NSURLSessionDownloadTask*)downloadTask
                 didWriteData:(int64_t)bytesWritten
            totalBytesWritten:(int64_t)totalBytesWritten
    totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite
                     delegate:(id<NSURLSessionDelegate>)delegate;
- (void)URLSession:(NSURLSession*)session
                         task:(NSURLSessionDownloadTask*)downloadTask
    didFinishDownloadingToURL:(NSURL*)location
                         data:(NSData*)data
                     delegate:(id<NSURLSessionDelegate>)delegate;

- (void)URLSessionTaskWillResume:(NSURLSessionTask*)task;

@end

@interface FLEXNetworkObserver ()

@property(nonatomic, strong)
    NSMutableDictionary<NSString*, FLEXInternalRequestState*>*
        requestStatesForRequestIDs;
@property(nonatomic, strong) dispatch_queue_t queue;

@end

@implementation FLEXNetworkObserver

#pragma mark - Public Methods

+ (void)start {
  [self injectIntoAllNSURLConnectionDelegateClasses];
}

#pragma mark - Statics

+ (instancetype)sharedObserver {
  static FLEXNetworkObserver* sharedObserver = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedObserver = [[[self class] alloc] init];
  });
  return sharedObserver;
}

+ (NSString*)nextRequestID {
  return [[NSUUID UUID] UUIDString];
}

#pragma mark Delegate Injection Convenience Methods

/// All swizzled delegate methods should make use of this guard.
/// This will prevent duplicated sniffing when the original implementation calls
/// up to a superclass implementation which we've also swizzled. The superclass
/// implementation (and implementations in classes above that) will be executed
/// without inteference if called from the original implementation.
+ (void)sniffWithoutDuplicationForObject:(NSObject*)object
                                selector:(SEL)selector
                           sniffingBlock:(void (^)(void))sniffingBlock
             originalImplementationBlock:
                 (void (^)(void))originalImplementationBlock {
  // If we don't have an object to detect nested calls on, just run the original
  // implmentation and bail. This case can happen if someone besides the URL
  // loading system calls the delegate methods directly. See
  // https://github.com/Flipboard/FLEX/issues/61 for an example.
  if (!object) {
    originalImplementationBlock();
    return;
  }

  const void* key = selector;

  // Don't run the sniffing block if we're inside a nested call
  if (!objc_getAssociatedObject(object, key)) {
    sniffingBlock();
  }

  // Mark that we're calling through to the original so we can detect nested
  // calls
  objc_setAssociatedObject(
      object, key, @YES, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  originalImplementationBlock();
  objc_setAssociatedObject(object, key, nil, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

#pragma mark - Delegate Injection

+ (void)injectIntoAllNSURLConnectionDelegateClasses {
  // Only allow swizzling once.
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // Swizzle any classes that implement one of these selectors.
    const SEL selectors[] = {
      @selector(connectionDidFinishLoading:),
      @selector(connection:willSendRequest:redirectResponse:),
      @selector(connection:didReceiveResponse:),
      @selector(connection:didReceiveData:),
      @selector(connection:didFailWithError:),
      @selector
      (URLSession:
             task:willPerformHTTPRedirection:newRequest:completionHandler:),
      @selector(URLSession:dataTask:didReceiveData:),
      @selector(URLSession:dataTask:didReceiveResponse:completionHandler:),
      @selector(URLSession:task:didCompleteWithError:),
      @selector(URLSession:dataTask:didBecomeDownloadTask:),
      @selector(URLSession:
              downloadTask:didWriteData:totalBytesWritten
                          :totalBytesExpectedToWrite:),
      @selector(URLSession:downloadTask:didFinishDownloadingToURL:)
    };

    const int numSelectors = sizeof(selectors) / sizeof(SEL);

    Class* classes = NULL;
    int numClasses = objc_getClassList(NULL, 0);

    if (numClasses > 0) {
      classes = (__unsafe_unretained Class*)malloc(sizeof(Class) * numClasses);
      numClasses = objc_getClassList(classes, numClasses);
      for (NSInteger classIndex = 0; classIndex < numClasses; ++classIndex) {
        Class className = classes[classIndex];

        if (className == [FLEXNetworkObserver class]) {
          continue;
        }

        // Use the runtime API rather than the methods on NSObject to avoid
        // sending messages to classes we're not interested in swizzling.
        // Otherwise we hit +initialize on all classes. NOTE: calling
        // class_getInstanceMethod() DOES send +initialize to the class. That's
        // why we iterate through the method list.
        unsigned int methodCount = 0;
        Method* methods = class_copyMethodList(className, &methodCount);
        BOOL matchingSelectorFound = NO;
        for (unsigned int methodIndex = 0; methodIndex < methodCount;
             methodIndex++) {
          for (int selectorIndex = 0; selectorIndex < numSelectors;
               ++selectorIndex) {
            if (method_getName(methods[methodIndex]) ==
                selectors[selectorIndex]) {
              [self injectIntoDelegateClass:className];
              matchingSelectorFound = YES;
              break;
            }
          }
          if (matchingSelectorFound) {
            break;
          }
        }
        free(methods);
      }

      free(classes);
    }

    [self injectIntoNSURLConnectionCancel];
    [self injectIntoNSURLSessionTaskResume];

    [self injectIntoNSURLConnectionAsynchronousClassMethod];
    [self injectIntoNSURLConnectionSynchronousClassMethod];

    [self injectIntoNSURLSessionAsyncDataAndDownloadTaskMethods];
    [self injectIntoNSURLSessionAsyncUploadTaskMethods];
  });
}

+ (void)injectIntoDelegateClass:(Class)cls {
  // Connections
  [self injectWillSendRequestIntoDelegateClass:cls];
  [self injectDidReceiveDataIntoDelegateClass:cls];
  [self injectDidReceiveResponseIntoDelegateClass:cls];
  [self injectDidFinishLoadingIntoDelegateClass:cls];
  [self injectDidFailWithErrorIntoDelegateClass:cls];

  // Sessions
  [self injectTaskWillPerformHTTPRedirectionIntoDelegateClass:cls];
  [self injectTaskDidReceiveDataIntoDelegateClass:cls];
  [self injectTaskDidReceiveResponseIntoDelegateClass:cls];
  [self injectTaskDidCompleteWithErrorIntoDelegateClass:cls];
  [self injectRespondsToSelectorIntoDelegateClass:cls];

  // Data tasks
  [self injectDataTaskDidBecomeDownloadTaskIntoDelegateClass:cls];

  // Download tasks
  [self injectDownloadTaskDidWriteDataIntoDelegateClass:cls];
  [self injectDownloadTaskDidFinishDownloadingIntoDelegateClass:cls];
}

+ (void)injectIntoNSURLConnectionCancel {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class className = [NSURLConnection class];
    SEL selector = @selector(cancel);
    SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];
    Method originalCancel = class_getInstanceMethod(className, selector);

    void (^swizzleBlock)(NSURLConnection*) = ^(NSURLConnection* slf) {
      [[FLEXNetworkObserver sharedObserver] connectionWillCancel:slf];
      ((void (*)(id, SEL))objc_msgSend)(slf, swizzledSelector);
    };

    IMP implementation = imp_implementationWithBlock(swizzleBlock);
    class_addMethod(
        className,
        swizzledSelector,
        implementation,
        method_getTypeEncoding(originalCancel));
    Method newCancel = class_getInstanceMethod(className, swizzledSelector);
    method_exchangeImplementations(originalCancel, newCancel);
  });
}

+ (void)injectIntoNSURLSessionTaskResume {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // In iOS 7 resume lives in __NSCFLocalSessionTask
    // In iOS 8 resume lives in NSURLSessionTask
    // In iOS 9 resume lives in __NSCFURLSessionTask
    // In iOS 14 resume lives in NSURLSessionTask
    Class className = Nil;
    if (![[NSProcessInfo processInfo]
            respondsToSelector:@selector(operatingSystemVersion)]) {
      className =
          NSClassFromString([@[ @"__", @"NSC", @"FLocalS", @"ession", @"Task" ]
              componentsJoinedByString:@""]);
    } else if (
        [[NSProcessInfo processInfo] operatingSystemVersion].majorVersion < 9 ||
        [[NSProcessInfo processInfo] operatingSystemVersion].majorVersion >=
            14) {
      className = [NSURLSessionTask class];
    } else {
      className =
          NSClassFromString([@[ @"__", @"NSC", @"FURLS", @"ession", @"Task" ]
              componentsJoinedByString:@""]);
    }
    SEL selector = @selector(resume);
    SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

    Method originalResume = class_getInstanceMethod(className, selector);

    void (^swizzleBlock)(NSURLSessionTask*) = ^(NSURLSessionTask* slf) {
      // iOS's internal HTTP parser finalization code is mysteriously not thread
      // safe, invoke it asynchronously has a chance to cause a `double free`
      // crash. This line below will ask for HTTPBody synchronously, make the
      // HTTPParser parse the request and cache them in advance, After that the
      // HTTPParser will be finalized, make sure other threads inspecting the
      // request won't trigger a race to finalize the parser.
      [slf.currentRequest HTTPBody];

      [[FLEXNetworkObserver sharedObserver] URLSessionTaskWillResume:slf];
      ((void (*)(id, SEL))objc_msgSend)(slf, swizzledSelector);
    };

    IMP implementation = imp_implementationWithBlock(swizzleBlock);
    class_addMethod(
        className,
        swizzledSelector,
        implementation,
        method_getTypeEncoding(originalResume));
    Method newResume = class_getInstanceMethod(className, swizzledSelector);
    method_exchangeImplementations(originalResume, newResume);
  });
}

+ (void)injectIntoNSURLConnectionAsynchronousClassMethod {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class className = objc_getMetaClass(class_getName([NSURLConnection class]));
    SEL selector = @selector(sendAsynchronousRequest:queue:completionHandler:);
    SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

    typedef void (^NSURLConnectionAsyncCompletion)(
        NSURLResponse* response, NSData* data, NSError* connectionError);

    void (^asyncSwizzleBlock)(
        Class,
        NSURLRequest*,
        NSOperationQueue*,
        NSURLConnectionAsyncCompletion) =
        ^(Class slf,
          NSURLRequest* request,
          NSOperationQueue* queue,
          NSURLConnectionAsyncCompletion completion) {
          NSString* requestID = [self nextRequestID];
          [[FLEXNetworkRecorder defaultRecorder]
              recordRequestWillBeSentWithRequestID:requestID
                                           request:request
                                  redirectResponse:nil];
          NSString* mechanism = [self mechanismFromClassMethod:selector
                                                       onClass:className];
          [[FLEXNetworkRecorder defaultRecorder] recordMechanism:mechanism
                                                    forRequestID:requestID];
          NSURLConnectionAsyncCompletion completionWrapper = ^(
              NSURLResponse* response, NSData* data, NSError* connectionError) {
            [[FLEXNetworkRecorder defaultRecorder]
                recordResponseReceivedWithRequestID:requestID
                                           response:response];
            [[FLEXNetworkRecorder defaultRecorder]
                recordDataReceivedWithRequestID:requestID
                                     dataLength:[data length]];
            if (connectionError) {
              [[FLEXNetworkRecorder defaultRecorder]
                  recordLoadingFailedWithRequestID:requestID
                                             error:connectionError];
            } else {
              [[FLEXNetworkRecorder defaultRecorder]
                  recordLoadingFinishedWithRequestID:requestID
                                        responseBody:data];
            }

            // Call through to the original completion handler
            if (completion) {
              completion(response, data, connectionError);
            }
          };
          ((void (*)(id, SEL, id, id, id))objc_msgSend)(
              slf, swizzledSelector, request, queue, completionWrapper);
        };

    [FLEXUtility replaceImplementationOfKnownSelector:selector
                                              onClass:className
                                            withBlock:asyncSwizzleBlock
                                     swizzledSelector:swizzledSelector];
  });
}

+ (void)injectIntoNSURLConnectionSynchronousClassMethod {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class className = objc_getMetaClass(class_getName([NSURLConnection class]));
    SEL selector = @selector(sendSynchronousRequest:returningResponse:error:);
    SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

    NSData* (^syncSwizzleBlock)(
        Class, NSURLRequest*, NSURLResponse**, NSError**) =
        ^NSData*(
            Class slf,
            NSURLRequest* request,
            NSURLResponse** response,
            NSError** error) {
      NSData* data = nil;
      NSString* requestID = [self nextRequestID];
      [[FLEXNetworkRecorder defaultRecorder]
          recordRequestWillBeSentWithRequestID:requestID
                                       request:request
                              redirectResponse:nil];
      NSString* mechanism = [self mechanismFromClassMethod:selector
                                                   onClass:className];
      [[FLEXNetworkRecorder defaultRecorder] recordMechanism:mechanism
                                                forRequestID:requestID];
      NSError* temporaryError = nil;
      NSURLResponse* temporaryResponse = nil;
      data = ((id(*)(id, SEL, id, NSURLResponse**, NSError**))objc_msgSend)(
          slf, swizzledSelector, request, &temporaryResponse, &temporaryError);
      [[FLEXNetworkRecorder defaultRecorder]
          recordResponseReceivedWithRequestID:requestID
                                     response:temporaryResponse];
      [[FLEXNetworkRecorder defaultRecorder]
          recordDataReceivedWithRequestID:requestID
                               dataLength:[data length]];
      if (temporaryError) {
        [[FLEXNetworkRecorder defaultRecorder]
            recordLoadingFailedWithRequestID:requestID
                                       error:temporaryError];
      } else {
        [[FLEXNetworkRecorder defaultRecorder]
            recordLoadingFinishedWithRequestID:requestID
                                  responseBody:data];
      }
      if (error) {
        *error = temporaryError;
      }
      if (response) {
        *response = temporaryResponse;
      }
      return data;
    };

    [FLEXUtility replaceImplementationOfKnownSelector:selector
                                              onClass:className
                                            withBlock:syncSwizzleBlock
                                     swizzledSelector:swizzledSelector];
  });
}

+ (void)injectIntoNSURLSessionAsyncDataAndDownloadTaskMethods {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class className = [NSURLSession class];

    // The method signatures here are close enough that we can use the same
    // logic to inject into all of them.
    const SEL selectors[] = {
      @selector(dataTaskWithRequest:completionHandler:),
      @selector(dataTaskWithURL:completionHandler:),
      @selector(downloadTaskWithRequest:completionHandler:),
      @selector(downloadTaskWithResumeData:completionHandler:),
      @selector(downloadTaskWithURL:completionHandler:)
    };

    const int numSelectors = sizeof(selectors) / sizeof(SEL);

    for (int selectorIndex = 0; selectorIndex < numSelectors; selectorIndex++) {
      SEL selector = selectors[selectorIndex];
      SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

      if ([FLEXUtility instanceRespondsButDoesNotImplementSelector:selector
                                                             class:className]) {
        // iOS 7 does not implement these methods on NSURLSession. We actually
        // want to swizzle __NSCFURLSession, which we can get from the class of
        // the shared session
        className = [[NSURLSession sharedSession] class];
      }

      NSURLSessionTask* (^asyncDataOrDownloadSwizzleBlock)(
          Class, id, NSURLSessionAsyncCompletion) =
          ^NSURLSessionTask*(
              Class slf, id argument, NSURLSessionAsyncCompletion completion) {
        NSURLSessionTask* task = nil;
        // If completion block was not provided sender expect to receive
        // delegated methods or does not interested in callback at all. In this
        // case we should just call original method implementation with nil
        // completion block.
        if (completion) {
          NSString* requestID = [self nextRequestID];
          NSString* mechanism = [self mechanismFromClassMethod:selector
                                                       onClass:className];
          NSURLSessionAsyncCompletion completionWrapper =
              [self asyncCompletionWrapperForRequestID:requestID
                                             mechanism:mechanism
                                            completion:completion];
          task = ((id(*)(id, SEL, id, id))objc_msgSend)(
              slf, swizzledSelector, argument, completionWrapper);
          [self setRequestID:requestID forConnectionOrTask:task];
        } else {
          task = ((id(*)(id, SEL, id, id))objc_msgSend)(
              slf, swizzledSelector, argument, completion);
        }
        return task;
      };

      [FLEXUtility
          replaceImplementationOfKnownSelector:selector
                                       onClass:className
                                     withBlock:asyncDataOrDownloadSwizzleBlock
                              swizzledSelector:swizzledSelector];
    }
  });
}

+ (void)injectIntoNSURLSessionAsyncUploadTaskMethods {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class className = [NSURLSession class];

    // The method signatures here are close enough that we can use the same
    // logic to inject into both of them. Note that they have 3 arguments, so we
    // can't easily combine with the data and download method above.
    const SEL selectors[] = {
      @selector(uploadTaskWithRequest:fromData:completionHandler:),
      @selector(uploadTaskWithRequest:fromFile:completionHandler:)
    };

    const int numSelectors = sizeof(selectors) / sizeof(SEL);

    for (int selectorIndex = 0; selectorIndex < numSelectors; selectorIndex++) {
      SEL selector = selectors[selectorIndex];
      SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

      if ([FLEXUtility instanceRespondsButDoesNotImplementSelector:selector
                                                             class:className]) {
        // iOS 7 does not implement these methods on NSURLSession. We actually
        // want to swizzle __NSCFURLSession, which we can get from the class of
        // the shared session
        className = [[NSURLSession sharedSession] class];
      }

      NSURLSessionUploadTask* (^asyncUploadTaskSwizzleBlock)(
          Class, NSURLRequest*, id, NSURLSessionAsyncCompletion) =
          ^NSURLSessionUploadTask*(
              Class slf,
              NSURLRequest* request,
              id argument,
              NSURLSessionAsyncCompletion completion) {
        NSURLSessionUploadTask* task = nil;
        if (completion) {
          NSString* requestID = [self nextRequestID];
          NSString* mechanism = [self mechanismFromClassMethod:selector
                                                       onClass:className];
          NSURLSessionAsyncCompletion completionWrapper =
              [self asyncCompletionWrapperForRequestID:requestID
                                             mechanism:mechanism
                                            completion:completion];
          task = ((id(*)(id, SEL, id, id, id))objc_msgSend)(
              slf, swizzledSelector, request, argument, completionWrapper);
          [self setRequestID:requestID forConnectionOrTask:task];
        } else {
          task = ((id(*)(id, SEL, id, id, id))objc_msgSend)(
              slf, swizzledSelector, request, argument, completion);
        }
        return task;
      };

      [FLEXUtility
          replaceImplementationOfKnownSelector:selector
                                       onClass:className
                                     withBlock:asyncUploadTaskSwizzleBlock
                              swizzledSelector:swizzledSelector];
    }
  });
}

+ (NSString*)mechanismFromClassMethod:(SEL)selector onClass:(Class)className {
  return [NSString stringWithFormat:@"+[%@ %@]",
                                    NSStringFromClass(className),
                                    NSStringFromSelector(selector)];
}

+ (NSURLSessionAsyncCompletion)
    asyncCompletionWrapperForRequestID:(NSString*)requestID
                             mechanism:(NSString*)mechanism
                            completion:(NSURLSessionAsyncCompletion)completion {
  NSURLSessionAsyncCompletion completionWrapper =
      ^(id fileURLOrData, NSURLResponse* response, NSError* error) {
        [[FLEXNetworkRecorder defaultRecorder] recordMechanism:mechanism
                                                  forRequestID:requestID];
        [[FLEXNetworkRecorder defaultRecorder]
            recordResponseReceivedWithRequestID:requestID
                                       response:response];
        NSData* data = nil;
        if ([fileURLOrData isKindOfClass:[NSURL class]]) {
          data = [NSData dataWithContentsOfURL:fileURLOrData];
        } else if ([fileURLOrData isKindOfClass:[NSData class]]) {
          data = fileURLOrData;
        }
        [[FLEXNetworkRecorder defaultRecorder]
            recordDataReceivedWithRequestID:requestID
                                 dataLength:[data length]];
        if (error) {
          [[FLEXNetworkRecorder defaultRecorder]
              recordLoadingFailedWithRequestID:requestID
                                         error:error];
        } else {
          [[FLEXNetworkRecorder defaultRecorder]
              recordLoadingFinishedWithRequestID:requestID
                                    responseBody:data];
        }

        // Call through to the original completion handler
        if (completion) {
          completion(fileURLOrData, response, error);
        }
      };
  return completionWrapper;
}

+ (void)injectWillSendRequestIntoDelegateClass:(Class)cls {
  SEL selector = @selector(connection:willSendRequest:redirectResponse:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLConnectionDataDelegate);
  if (!protocol) {
    protocol = @protocol(NSURLConnectionDelegate);
  }

  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef NSURLRequest* (^NSURLConnectionWillSendRequestBlock)(
      id<NSURLConnectionDelegate> slf,
      NSURLConnection* connection,
      NSURLRequest* request,
      NSURLResponse* response);

  NSURLConnectionWillSendRequestBlock undefinedBlock = ^NSURLRequest*(
      id<NSURLConnectionDelegate> slf,
      NSURLConnection* connection,
      NSURLRequest* request,
      NSURLResponse* response) {
    [[FLEXNetworkObserver sharedObserver] connection:connection
                                     willSendRequest:request
                                    redirectResponse:response
                                            delegate:slf];
    return request;
  };

  NSURLConnectionWillSendRequestBlock implementationBlock = ^NSURLRequest*(
      id<NSURLConnectionDelegate> slf,
      NSURLConnection* connection,
      NSURLRequest* request,
      NSURLResponse* response) {
    __block NSURLRequest* returnValue = nil;
    [self sniffWithoutDuplicationForObject:connection
        selector:selector
        sniffingBlock:^{
          undefinedBlock(slf, connection, request, response);
        }
        originalImplementationBlock:^{
          returnValue = ((id(*)(id, SEL, id, id, id))objc_msgSend)(
              slf, swizzledSelector, connection, request, response);
        }];
    return returnValue;
  };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectDidReceiveResponseIntoDelegateClass:(Class)cls {
  SEL selector = @selector(connection:didReceiveResponse:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLConnectionDataDelegate);
  if (!protocol) {
    protocol = @protocol(NSURLConnectionDelegate);
  }

  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLConnectionDidReceiveResponseBlock)(
      id<NSURLConnectionDelegate> slf,
      NSURLConnection* connection,
      NSURLResponse* response);

  NSURLConnectionDidReceiveResponseBlock undefinedBlock =
      ^(id<NSURLConnectionDelegate> slf,
        NSURLConnection* connection,
        NSURLResponse* response) {
        [[FLEXNetworkObserver sharedObserver] connection:connection
                                      didReceiveResponse:response
                                                delegate:slf];
      };

  NSURLConnectionDidReceiveResponseBlock implementationBlock =
      ^(id<NSURLConnectionDelegate> slf,
        NSURLConnection* connection,
        NSURLResponse* response) {
        [self sniffWithoutDuplicationForObject:connection
            selector:selector
            sniffingBlock:^{
              undefinedBlock(slf, connection, response);
            }
            originalImplementationBlock:^{
              ((void (*)(id, SEL, id, id))objc_msgSend)(
                  slf, swizzledSelector, connection, response);
            }];
      };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectDidReceiveDataIntoDelegateClass:(Class)cls {
  SEL selector = @selector(connection:didReceiveData:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLConnectionDataDelegate);
  if (!protocol) {
    protocol = @protocol(NSURLConnectionDelegate);
  }

  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLConnectionDidReceiveDataBlock)(
      id<NSURLConnectionDelegate> slf,
      NSURLConnection* connection,
      NSData* data);

  NSURLConnectionDidReceiveDataBlock undefinedBlock =
      ^(id<NSURLConnectionDelegate> slf,
        NSURLConnection* connection,
        NSData* data) {
        [[FLEXNetworkObserver sharedObserver] connection:connection
                                          didReceiveData:data
                                                delegate:slf];
      };

  NSURLConnectionDidReceiveDataBlock implementationBlock =
      ^(id<NSURLConnectionDelegate> slf,
        NSURLConnection* connection,
        NSData* data) {
        [self sniffWithoutDuplicationForObject:connection
            selector:selector
            sniffingBlock:^{
              undefinedBlock(slf, connection, data);
            }
            originalImplementationBlock:^{
              ((void (*)(id, SEL, id, id))objc_msgSend)(
                  slf, swizzledSelector, connection, data);
            }];
      };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectDidFinishLoadingIntoDelegateClass:(Class)cls {
  SEL selector = @selector(connectionDidFinishLoading:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLConnectionDataDelegate);
  if (!protocol) {
    protocol = @protocol(NSURLConnectionDelegate);
  }

  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLConnectionDidFinishLoadingBlock)(
      id<NSURLConnectionDelegate> slf, NSURLConnection* connection);

  NSURLConnectionDidFinishLoadingBlock undefinedBlock = ^(
      id<NSURLConnectionDelegate> slf, NSURLConnection* connection) {
    [[FLEXNetworkObserver sharedObserver] connectionDidFinishLoading:connection
                                                            delegate:slf];
  };

  NSURLConnectionDidFinishLoadingBlock implementationBlock =
      ^(id<NSURLConnectionDelegate> slf, NSURLConnection* connection) {
        [self sniffWithoutDuplicationForObject:connection
            selector:selector
            sniffingBlock:^{
              undefinedBlock(slf, connection);
            }
            originalImplementationBlock:^{
              ((void (*)(id, SEL, id))objc_msgSend)(
                  slf, swizzledSelector, connection);
            }];
      };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectDidFailWithErrorIntoDelegateClass:(Class)cls {
  SEL selector = @selector(connection:didFailWithError:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLConnectionDelegate);
  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLConnectionDidFailWithErrorBlock)(
      id<NSURLConnectionDelegate> slf,
      NSURLConnection* connection,
      NSError* error);

  NSURLConnectionDidFailWithErrorBlock undefinedBlock =
      ^(id<NSURLConnectionDelegate> slf,
        NSURLConnection* connection,
        NSError* error) {
        [[FLEXNetworkObserver sharedObserver] connection:connection
                                        didFailWithError:error
                                                delegate:slf];
      };

  NSURLConnectionDidFailWithErrorBlock implementationBlock =
      ^(id<NSURLConnectionDelegate> slf,
        NSURLConnection* connection,
        NSError* error) {
        [self sniffWithoutDuplicationForObject:connection
            selector:selector
            sniffingBlock:^{
              undefinedBlock(slf, connection, error);
            }
            originalImplementationBlock:^{
              ((void (*)(id, SEL, id, id))objc_msgSend)(
                  slf, swizzledSelector, connection, error);
            }];
      };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectTaskWillPerformHTTPRedirectionIntoDelegateClass:(Class)cls {
  SEL selector = @selector
      (URLSession:
             task:willPerformHTTPRedirection:newRequest:completionHandler:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLSessionTaskDelegate);

  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLSessionWillPerformHTTPRedirectionBlock)(
      id<NSURLSessionTaskDelegate> slf,
      NSURLSession* session,
      NSURLSessionTask* task,
      NSHTTPURLResponse* response,
      NSURLRequest* newRequest,
      void (^completionHandler)(NSURLRequest*));

  NSURLSessionWillPerformHTTPRedirectionBlock undefinedBlock =
      ^(id<NSURLSessionTaskDelegate> slf,
        NSURLSession* session,
        NSURLSessionTask* task,
        NSHTTPURLResponse* response,
        NSURLRequest* newRequest,
        void (^completionHandler)(NSURLRequest*)) {
        [[FLEXNetworkObserver sharedObserver] URLSession:session
                                                    task:task
                              willPerformHTTPRedirection:response
                                              newRequest:newRequest
                                       completionHandler:completionHandler
                                                delegate:slf];
        completionHandler(newRequest);
      };

  NSURLSessionWillPerformHTTPRedirectionBlock implementationBlock = ^(
      id<NSURLSessionTaskDelegate> slf,
      NSURLSession* session,
      NSURLSessionTask* task,
      NSHTTPURLResponse* response,
      NSURLRequest* newRequest,
      void (^completionHandler)(NSURLRequest*)) {
    [self sniffWithoutDuplicationForObject:session
        selector:selector
        sniffingBlock:^{
          [[FLEXNetworkObserver sharedObserver] URLSession:session
                                                      task:task
                                willPerformHTTPRedirection:response
                                                newRequest:newRequest
                                         completionHandler:completionHandler
                                                  delegate:slf];
        }
        originalImplementationBlock:^{
          ((id(*)(
              id, SEL, id, id, id, id, void (^)(NSURLRequest*)))objc_msgSend)(
              slf,
              swizzledSelector,
              session,
              task,
              response,
              newRequest,
              completionHandler);
        }];
  };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectTaskDidReceiveDataIntoDelegateClass:(Class)cls {
  SEL selector = @selector(URLSession:dataTask:didReceiveData:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLSessionDataDelegate);

  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLSessionDidReceiveDataBlock)(
      id<NSURLSessionDataDelegate> slf,
      NSURLSession* session,
      NSURLSessionDataTask* dataTask,
      NSData* data);

  NSURLSessionDidReceiveDataBlock undefinedBlock =
      ^(id<NSURLSessionDataDelegate> slf,
        NSURLSession* session,
        NSURLSessionDataTask* dataTask,
        NSData* data) {
        [[FLEXNetworkObserver sharedObserver] URLSession:session
                                                dataTask:dataTask
                                          didReceiveData:data
                                                delegate:slf];
      };

  NSURLSessionDidReceiveDataBlock implementationBlock =
      ^(id<NSURLSessionDataDelegate> slf,
        NSURLSession* session,
        NSURLSessionDataTask* dataTask,
        NSData* data) {
        [self sniffWithoutDuplicationForObject:session
            selector:selector
            sniffingBlock:^{
              undefinedBlock(slf, session, dataTask, data);
            }
            originalImplementationBlock:^{
              ((void (*)(id, SEL, id, id, id))objc_msgSend)(
                  slf, swizzledSelector, session, dataTask, data);
            }];
      };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectDataTaskDidBecomeDownloadTaskIntoDelegateClass:(Class)cls {
  SEL selector = @selector(URLSession:dataTask:didBecomeDownloadTask:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLSessionDataDelegate);

  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLSessionDidBecomeDownloadTaskBlock)(
      id<NSURLSessionDataDelegate> slf,
      NSURLSession* session,
      NSURLSessionDataTask* dataTask,
      NSURLSessionDownloadTask* downloadTask);

  NSURLSessionDidBecomeDownloadTaskBlock undefinedBlock =
      ^(id<NSURLSessionDataDelegate> slf,
        NSURLSession* session,
        NSURLSessionDataTask* dataTask,
        NSURLSessionDownloadTask* downloadTask) {
        [[FLEXNetworkObserver sharedObserver] URLSession:session
                                                dataTask:dataTask
                                   didBecomeDownloadTask:downloadTask
                                                delegate:slf];
      };

  NSURLSessionDidBecomeDownloadTaskBlock implementationBlock =
      ^(id<NSURLSessionDataDelegate> slf,
        NSURLSession* session,
        NSURLSessionDataTask* dataTask,
        NSURLSessionDownloadTask* downloadTask) {
        [self sniffWithoutDuplicationForObject:session
            selector:selector
            sniffingBlock:^{
              undefinedBlock(slf, session, dataTask, downloadTask);
            }
            originalImplementationBlock:^{
              ((void (*)(id, SEL, id, id, id))objc_msgSend)(
                  slf, swizzledSelector, session, dataTask, downloadTask);
            }];
      };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectTaskDidReceiveResponseIntoDelegateClass:(Class)cls {
  SEL selector = @selector(URLSession:
                             dataTask:didReceiveResponse:completionHandler:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLSessionDataDelegate);

  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLSessionDidReceiveResponseBlock)(
      id<NSURLSessionDelegate> slf,
      NSURLSession* session,
      NSURLSessionDataTask* dataTask,
      NSURLResponse* response,
      void (^completionHandler)(NSURLSessionResponseDisposition disposition));

  NSURLSessionDidReceiveResponseBlock undefinedBlock = ^(
      id<NSURLSessionDelegate> slf,
      NSURLSession* session,
      NSURLSessionDataTask* dataTask,
      NSURLResponse* response,
      void (^completionHandler)(NSURLSessionResponseDisposition disposition)) {
    [[FLEXNetworkObserver sharedObserver] URLSession:session
                                            dataTask:dataTask
                                  didReceiveResponse:response
                                   completionHandler:completionHandler
                                            delegate:slf];
    completionHandler(NSURLSessionResponseAllow);
  };

  NSURLSessionDidReceiveResponseBlock implementationBlock = ^(
      id<NSURLSessionDelegate> slf,
      NSURLSession* session,
      NSURLSessionDataTask* dataTask,
      NSURLResponse* response,
      void (^completionHandler)(NSURLSessionResponseDisposition disposition)) {
    [self sniffWithoutDuplicationForObject:session
        selector:selector
        sniffingBlock:^{
          [[FLEXNetworkObserver sharedObserver] URLSession:session
                                                  dataTask:dataTask
                                        didReceiveResponse:response
                                         completionHandler:completionHandler
                                                  delegate:slf];
        }
        originalImplementationBlock:^{
          ((void (*)(
              id, SEL, id, id, id, void (^)(NSURLSessionResponseDisposition)))
               objc_msgSend)(
              slf,
              swizzledSelector,
              session,
              dataTask,
              response,
              completionHandler);
        }];
  };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectTaskDidCompleteWithErrorIntoDelegateClass:(Class)cls {
  SEL selector = @selector(URLSession:task:didCompleteWithError:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLSessionTaskDelegate);
  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLSessionTaskDidCompleteWithErrorBlock)(
      id<NSURLSessionTaskDelegate> slf,
      NSURLSession* session,
      NSURLSessionTask* task,
      NSError* error);

  NSURLSessionTaskDidCompleteWithErrorBlock undefinedBlock =
      ^(id<NSURLSessionTaskDelegate> slf,
        NSURLSession* session,
        NSURLSessionTask* task,
        NSError* error) {
        [[FLEXNetworkObserver sharedObserver] URLSession:session
                                                    task:task
                                    didCompleteWithError:error
                                                delegate:slf];
      };

  NSURLSessionTaskDidCompleteWithErrorBlock implementationBlock =
      ^(id<NSURLSessionTaskDelegate> slf,
        NSURLSession* session,
        NSURLSessionTask* task,
        NSError* error) {
        [self sniffWithoutDuplicationForObject:session
            selector:selector
            sniffingBlock:^{
              undefinedBlock(slf, session, task, error);
            }
            originalImplementationBlock:^{
              ((void (*)(id, SEL, id, id, id))objc_msgSend)(
                  slf, swizzledSelector, session, task, error);
            }];
      };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

// Used for overriding AFNetworking behavior
+ (void)injectRespondsToSelectorIntoDelegateClass:(Class)cls {
  SEL selector = @selector(respondsToSelector:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  // Protocol *protocol = @protocol(NSURLSessionTaskDelegate);
  Method method = class_getInstanceMethod(cls, selector);
  struct objc_method_description methodDescription =
      *method_getDescription(method);

  BOOL (^undefinedBlock)(id<NSURLSessionTaskDelegate>, SEL) =
      ^(id slf, SEL sel) {
        return YES;
      };

  BOOL (^implementationBlock)(id<NSURLSessionTaskDelegate>, SEL) = ^(
      id<NSURLSessionTaskDelegate> slf, SEL sel) {
    if (sel ==
        @selector(URLSession:dataTask:didReceiveResponse:completionHandler:)) {
      return undefinedBlock(slf, sel);
    }
    return ((BOOL(*)(id, SEL, SEL))objc_msgSend)(slf, swizzledSelector, sel);
  };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectDownloadTaskDidFinishDownloadingIntoDelegateClass:(Class)cls {
  SEL selector = @selector(URLSession:downloadTask:didFinishDownloadingToURL:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLSessionDownloadDelegate);
  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLSessionDownloadTaskDidFinishDownloadingBlock)(
      id<NSURLSessionTaskDelegate> slf,
      NSURLSession* session,
      NSURLSessionDownloadTask* task,
      NSURL* location);

  NSURLSessionDownloadTaskDidFinishDownloadingBlock undefinedBlock =
      ^(id<NSURLSessionTaskDelegate> slf,
        NSURLSession* session,
        NSURLSessionDownloadTask* task,
        NSURL* location) {
        NSData* data = [NSData dataWithContentsOfFile:location.relativePath];
        [[FLEXNetworkObserver sharedObserver] URLSession:session
                                                    task:task
                               didFinishDownloadingToURL:location
                                                    data:data
                                                delegate:slf];
      };

  NSURLSessionDownloadTaskDidFinishDownloadingBlock implementationBlock =
      ^(id<NSURLSessionTaskDelegate> slf,
        NSURLSession* session,
        NSURLSessionDownloadTask* task,
        NSURL* location) {
        [self sniffWithoutDuplicationForObject:session
            selector:selector
            sniffingBlock:^{
              undefinedBlock(slf, session, task, location);
            }
            originalImplementationBlock:^{
              ((void (*)(id, SEL, id, id, id))objc_msgSend)(
                  slf, swizzledSelector, session, task, location);
            }];
      };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

+ (void)injectDownloadTaskDidWriteDataIntoDelegateClass:(Class)cls {
  SEL selector = @selector(
        URLSession:
      downloadTask:didWriteData:totalBytesWritten:totalBytesExpectedToWrite:);
  SEL swizzledSelector = [FLEXUtility swizzledSelectorForSelector:selector];

  Protocol* protocol = @protocol(NSURLSessionDownloadDelegate);
  struct objc_method_description methodDescription =
      protocol_getMethodDescription(protocol, selector, NO, YES);

  typedef void (^NSURLSessionDownloadTaskDidWriteDataBlock)(
      id<NSURLSessionTaskDelegate> slf,
      NSURLSession* session,
      NSURLSessionDownloadTask* task,
      int64_t bytesWritten,
      int64_t totalBytesWritten,
      int64_t totalBytesExpectedToWrite);

  NSURLSessionDownloadTaskDidWriteDataBlock undefinedBlock = ^(
      id<NSURLSessionTaskDelegate> slf,
      NSURLSession* session,
      NSURLSessionDownloadTask* task,
      int64_t bytesWritten,
      int64_t totalBytesWritten,
      int64_t totalBytesExpectedToWrite) {
    [[FLEXNetworkObserver sharedObserver] URLSession:session
                                        downloadTask:task
                                        didWriteData:bytesWritten
                                   totalBytesWritten:totalBytesWritten
                           totalBytesExpectedToWrite:totalBytesExpectedToWrite
                                            delegate:slf];
  };

  NSURLSessionDownloadTaskDidWriteDataBlock implementationBlock = ^(
      id<NSURLSessionTaskDelegate> slf,
      NSURLSession* session,
      NSURLSessionDownloadTask* task,
      int64_t bytesWritten,
      int64_t totalBytesWritten,
      int64_t totalBytesExpectedToWrite) {
    [self sniffWithoutDuplicationForObject:session
        selector:selector
        sniffingBlock:^{
          undefinedBlock(
              slf,
              session,
              task,
              bytesWritten,
              totalBytesWritten,
              totalBytesExpectedToWrite);
        }
        originalImplementationBlock:^{
          ((void (*)(id, SEL, id, id, int64_t, int64_t, int64_t))objc_msgSend)(
              slf,
              swizzledSelector,
              session,
              task,
              bytesWritten,
              totalBytesWritten,
              totalBytesExpectedToWrite);
        }];
  };

  [FLEXUtility replaceImplementationOfSelector:selector
                                  withSelector:swizzledSelector
                                      forClass:cls
                         withMethodDescription:methodDescription
                           implementationBlock:implementationBlock
                                undefinedBlock:undefinedBlock];
}

static char const* const kFLEXRequestIDKey = "kFLEXRequestIDKey";

+ (NSString*)requestIDForConnectionOrTask:(id)connectionOrTask {
  NSString* requestID =
      objc_getAssociatedObject(connectionOrTask, kFLEXRequestIDKey);
  if (!requestID) {
    requestID = [self nextRequestID];
    [self setRequestID:requestID forConnectionOrTask:connectionOrTask];
  }
  return requestID;
}

+ (void)setRequestID:(NSString*)requestID
    forConnectionOrTask:(id)connectionOrTask {
  if (connectionOrTask) {
    objc_setAssociatedObject(
        connectionOrTask,
        kFLEXRequestIDKey,
        requestID,
        OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
}

#pragma mark - Initialization

- (id)init {
  self = [super init];
  if (self) {
    self.requestStatesForRequestIDs = [NSMutableDictionary new];
    self.queue = dispatch_queue_create(
        "com.flex.FLEXNetworkObserver", DISPATCH_QUEUE_SERIAL);
  }
  return self;
}

#pragma mark - Private Methods

- (void)performBlock:(dispatch_block_t)block {
  dispatch_async(_queue, block);
}

- (FLEXInternalRequestState*)requestStateForRequestID:(NSString*)requestID {
  FLEXInternalRequestState* requestState =
      self.requestStatesForRequestIDs[requestID];
  if (!requestState) {
    requestState = [FLEXInternalRequestState new];
    [self.requestStatesForRequestIDs setObject:requestState forKey:requestID];
  }
  return requestState;
}

- (void)removeRequestStateForRequestID:(NSString*)requestID {
  [self.requestStatesForRequestIDs removeObjectForKey:requestID];
}

@end

@implementation FLEXNetworkObserver (NSURLConnectionHelpers)

- (void)connection:(NSURLConnection*)connection
     willSendRequest:(NSURLRequest*)request
    redirectResponse:(NSURLResponse*)response
            delegate:(id<NSURLConnectionDelegate>)delegate {
  [self performBlock:^{
    NSString* requestID =
        [[self class] requestIDForConnectionOrTask:connection];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];
    requestState.request = request;
    [[FLEXNetworkRecorder defaultRecorder]
        recordRequestWillBeSentWithRequestID:requestID
                                     request:request
                            redirectResponse:response];
    NSString* mechanism = [NSString
        stringWithFormat:@"NSURLConnection (delegate: %@)", [delegate class]];
    [[FLEXNetworkRecorder defaultRecorder] recordMechanism:mechanism
                                              forRequestID:requestID];
  }];
}

- (void)connection:(NSURLConnection*)connection
    didReceiveResponse:(NSURLResponse*)response
              delegate:(id<NSURLConnectionDelegate>)delegate {
  [self performBlock:^{
    NSString* requestID =
        [[self class] requestIDForConnectionOrTask:connection];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];

    NSMutableData* dataAccumulator = nil;
    if (response.expectedContentLength < 0) {
      dataAccumulator = [NSMutableData new];
    } else {
      dataAccumulator = [[NSMutableData alloc]
          initWithCapacity:(NSUInteger)response.expectedContentLength];
    }
    requestState.dataAccumulator = dataAccumulator;

    [[FLEXNetworkRecorder defaultRecorder]
        recordResponseReceivedWithRequestID:requestID
                                   response:response];
  }];
}

- (void)connection:(NSURLConnection*)connection
    didReceiveData:(NSData*)data
          delegate:(id<NSURLConnectionDelegate>)delegate {
  // Just to be safe since we're doing this async
  data = [data copy];
  [self performBlock:^{
    NSString* requestID =
        [[self class] requestIDForConnectionOrTask:connection];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];
    [requestState.dataAccumulator appendData:data];
    [[FLEXNetworkRecorder defaultRecorder]
        recordDataReceivedWithRequestID:requestID
                             dataLength:data.length];
  }];
}

- (void)connectionDidFinishLoading:(NSURLConnection*)connection
                          delegate:(id<NSURLConnectionDelegate>)delegate {
  [self performBlock:^{
    NSString* requestID =
        [[self class] requestIDForConnectionOrTask:connection];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];
    [[FLEXNetworkRecorder defaultRecorder]
        recordLoadingFinishedWithRequestID:requestID
                              responseBody:requestState.dataAccumulator];
    [self removeRequestStateForRequestID:requestID];
  }];
}

- (void)connection:(NSURLConnection*)connection
    didFailWithError:(NSError*)error
            delegate:(id<NSURLConnectionDelegate>)delegate {
  [self performBlock:^{
    NSString* requestID =
        [[self class] requestIDForConnectionOrTask:connection];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];

    // Cancellations can occur prior to the willSendRequest:... NSURLConnection
    // delegate call. These are pretty common and clutter up the logs. Only
    // record the failure if the recorder already knows about the request
    // through willSendRequest:...
    if (requestState.request) {
      [[FLEXNetworkRecorder defaultRecorder]
          recordLoadingFailedWithRequestID:requestID
                                     error:error];
    }

    [self removeRequestStateForRequestID:requestID];
  }];
}

- (void)connectionWillCancel:(NSURLConnection*)connection {
  [self performBlock:^{
    // Mimic the behavior of NSURLSession which is to create an error on
    // cancellation.
    NSDictionary<NSString*, id>* userInfo =
        @{NSLocalizedDescriptionKey : @"cancelled"};
    NSError* error = [NSError errorWithDomain:NSURLErrorDomain
                                         code:NSURLErrorCancelled
                                     userInfo:userInfo];
    [self connection:connection didFailWithError:error delegate:nil];
  }];
}

@end

@implementation FLEXNetworkObserver (NSURLSessionTaskHelpers)

- (void)URLSession:(NSURLSession*)session
                          task:(NSURLSessionTask*)task
    willPerformHTTPRedirection:(NSHTTPURLResponse*)response
                    newRequest:(NSURLRequest*)request
             completionHandler:(void (^)(NSURLRequest*))completionHandler
                      delegate:(id<NSURLSessionDelegate>)delegate {
  [self performBlock:^{
    NSString* requestID = [[self class] requestIDForConnectionOrTask:task];
    [[FLEXNetworkRecorder defaultRecorder]
        recordRequestWillBeSentWithRequestID:requestID
                                     request:request
                            redirectResponse:response];
  }];
}

- (void)URLSession:(NSURLSession*)session
              dataTask:(NSURLSessionDataTask*)dataTask
    didReceiveResponse:(NSURLResponse*)response
     completionHandler:(void (^)(NSURLSessionResponseDisposition disposition))
                           completionHandler
              delegate:(id<NSURLSessionDelegate>)delegate {
  [self performBlock:^{
    NSString* requestID = [[self class] requestIDForConnectionOrTask:dataTask];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];

    NSMutableData* dataAccumulator = nil;
    if (response.expectedContentLength < 0) {
      dataAccumulator = [NSMutableData new];
    } else {
      dataAccumulator = [[NSMutableData alloc]
          initWithCapacity:(NSUInteger)response.expectedContentLength];
    }
    requestState.dataAccumulator = dataAccumulator;

    NSString* requestMechanism =
        [NSString stringWithFormat:@"NSURLSessionDataTask (delegate: %@)",
                                   [delegate class]];
    [[FLEXNetworkRecorder defaultRecorder] recordMechanism:requestMechanism
                                              forRequestID:requestID];

    [[FLEXNetworkRecorder defaultRecorder]
        recordResponseReceivedWithRequestID:requestID
                                   response:response];
  }];
}

- (void)URLSession:(NSURLSession*)session
                 dataTask:(NSURLSessionDataTask*)dataTask
    didBecomeDownloadTask:(NSURLSessionDownloadTask*)downloadTask
                 delegate:(id<NSURLSessionDelegate>)delegate {
  [self performBlock:^{
    // By setting the request ID of the download task to match the data task,
    // it can pick up where the data task left off.
    NSString* requestID = [[self class] requestIDForConnectionOrTask:dataTask];
    [[self class] setRequestID:requestID forConnectionOrTask:downloadTask];
  }];
}

- (void)URLSession:(NSURLSession*)session
          dataTask:(NSURLSessionDataTask*)dataTask
    didReceiveData:(NSData*)data
          delegate:(id<NSURLSessionDelegate>)delegate {
  // Just to be safe since we're doing this async
  data = [data copy];
  [self performBlock:^{
    NSString* requestID = [[self class] requestIDForConnectionOrTask:dataTask];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];

    [requestState.dataAccumulator appendData:data];

    [[FLEXNetworkRecorder defaultRecorder]
        recordDataReceivedWithRequestID:requestID
                             dataLength:data.length];
  }];
}

- (void)URLSession:(NSURLSession*)session
                    task:(NSURLSessionTask*)task
    didCompleteWithError:(NSError*)error
                delegate:(id<NSURLSessionDelegate>)delegate {
  [self performBlock:^{
    NSString* requestID = [[self class] requestIDForConnectionOrTask:task];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];

    if (error) {
      [[FLEXNetworkRecorder defaultRecorder]
          recordLoadingFailedWithRequestID:requestID
                                     error:error];
    } else {
      [[FLEXNetworkRecorder defaultRecorder]
          recordLoadingFinishedWithRequestID:requestID
                                responseBody:requestState.dataAccumulator];
    }

    [self removeRequestStateForRequestID:requestID];
  }];
}

- (void)URLSession:(NSURLSession*)session
                 downloadTask:(NSURLSessionDownloadTask*)downloadTask
                 didWriteData:(int64_t)bytesWritten
            totalBytesWritten:(int64_t)totalBytesWritten
    totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite
                     delegate:(id<NSURLSessionDelegate>)delegate {
  [self performBlock:^{
    NSString* requestID =
        [[self class] requestIDForConnectionOrTask:downloadTask];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];

    if (!requestState.dataAccumulator) {
      NSUInteger unsignedBytesExpectedToWrite = totalBytesExpectedToWrite > 0
          ? (NSUInteger)totalBytesExpectedToWrite
          : 0;
      requestState.dataAccumulator =
          [[NSMutableData alloc] initWithCapacity:unsignedBytesExpectedToWrite];
      [[FLEXNetworkRecorder defaultRecorder]
          recordResponseReceivedWithRequestID:requestID
                                     response:downloadTask.response];

      NSString* requestMechanism =
          [NSString stringWithFormat:@"NSURLSessionDownloadTask (delegate: %@)",
                                     [delegate class]];
      [[FLEXNetworkRecorder defaultRecorder] recordMechanism:requestMechanism
                                                forRequestID:requestID];
    }

    [[FLEXNetworkRecorder defaultRecorder]
        recordDataReceivedWithRequestID:requestID
                             dataLength:bytesWritten];
  }];
}

- (void)URLSession:(NSURLSession*)session
                         task:(NSURLSessionDownloadTask*)downloadTask
    didFinishDownloadingToURL:(NSURL*)location
                         data:(NSData*)data
                     delegate:(id<NSURLSessionDelegate>)delegate {
  data = [data copy];
  [self performBlock:^{
    NSString* requestID =
        [[self class] requestIDForConnectionOrTask:downloadTask];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];
    [requestState.dataAccumulator appendData:data];
  }];
}

- (void)URLSessionTaskWillResume:(NSURLSessionTask*)task {
  // Since resume can be called multiple times on the same task, only treat the
  // first resume as the equivalent to connection:willSendRequest:...
  [self performBlock:^{
    NSString* requestID = [[self class] requestIDForConnectionOrTask:task];
    FLEXInternalRequestState* requestState =
        [self requestStateForRequestID:requestID];
    if (!requestState.request) {
      requestState.request = task.currentRequest;

      [[FLEXNetworkRecorder defaultRecorder]
          recordRequestWillBeSentWithRequestID:requestID
                                       request:task.currentRequest
                              redirectResponse:nil];
    }
  }];
}

@end
