// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 The key in the result dictionary for requests to old versions of the Graph API
 whose response is not a JSON object.


 When a request returns a non-JSON response (such as a "true" literal), that response
 will be wrapped into a dictionary using this const as the key. This only applies for very few Graph API
 prior to v2.1.
 */
FOUNDATION_EXPORT NSString *const FBSDKNonJSONResponseProperty
NS_SWIFT_NAME(NonJSONResponseProperty);

@class FBSDKGraphRequest;
@class FBSDKGraphRequestConnection;

/**
 FBSDKGraphRequestBlock

  A block that is passed to addRequest to register for a callback with the results of that
 request once the connection completes.

 Pass a block of this type when calling addRequest.  This will be called once
 the request completes.  The call occurs on the UI thread.

 @param connection The `FBSDKGraphRequestConnection` that sent the request.

 @param result The result of the request.  This is a translation of
 JSON data to `NSDictionary` and `NSArray` objects.  This
 is nil if there was an error.

 @param error The `NSError` representing any error that occurred.

 */
typedef void (^FBSDKGraphRequestBlock)(FBSDKGraphRequestConnection *_Nullable connection,
                                       id _Nullable result,
                                       NSError *_Nullable error)
NS_SWIFT_NAME(GraphRequestBlock);

/**
 @protocol

  The `FBSDKGraphRequestConnectionDelegate` protocol defines the methods used to receive network
 activity progress information from a <FBSDKGraphRequestConnection>.
 */
NS_SWIFT_NAME(GraphRequestConnectionDelegate)
@protocol FBSDKGraphRequestConnectionDelegate <NSObject>

@optional

/**
 @method

  Tells the delegate the request connection will begin loading



 If the <FBSDKGraphRequestConnection> is created using one of the convenience factory methods prefixed with
 start, the object returned from the convenience method has already begun loading and this method
 will not be called when the delegate is set.

 @param connection    The request connection that is starting a network request
 */
- (void)requestConnectionWillBeginLoading:(FBSDKGraphRequestConnection *)connection;

/**
 @method

  Tells the delegate the request connection finished loading



 If the request connection completes without a network error occurring then this method is called.
 Invocation of this method does not indicate success of every <FBSDKGraphRequest> made, only that the
 request connection has no further activity. Use the error argument passed to the FBSDKGraphRequestBlock
 block to determine success or failure of each <FBSDKGraphRequest>.

 This method is invoked after the completion handler for each <FBSDKGraphRequest>.

 @param connection    The request connection that successfully completed a network request
 */
- (void)requestConnectionDidFinishLoading:(FBSDKGraphRequestConnection *)connection;

/**
 @method

  Tells the delegate the request connection failed with an error



 If the request connection fails with a network error then this method is called. The `error`
 argument specifies why the network connection failed. The `NSError` object passed to the
 FBSDKGraphRequestBlock block may contain additional information.

 @param connection    The request connection that successfully completed a network request
 @param error         The `NSError` representing the network error that occurred, if any. May be nil
 in some circumstances. Consult the `NSError` for the <FBSDKGraphRequest> for reliable
 failure information.
 */
- (void)requestConnection:(FBSDKGraphRequestConnection *)connection
         didFailWithError:(NSError *)error;

/**
 @method

  Tells the delegate how much data has been sent and is planned to send to the remote host



 The byte count arguments refer to the aggregated <FBSDKGraphRequest> objects, not a particular <FBSDKGraphRequest>.

 Like `NSURLSession`, the values may change in unexpected ways if data needs to be resent.

 @param connection                The request connection transmitting data to a remote host
 @param bytesWritten              The number of bytes sent in the last transmission
 @param totalBytesWritten         The total number of bytes sent to the remote host
 @param totalBytesExpectedToWrite The total number of bytes expected to send to the remote host
 */
- (void)requestConnection:(FBSDKGraphRequestConnection *)connection
          didSendBodyData:(NSInteger)bytesWritten
        totalBytesWritten:(NSInteger)totalBytesWritten
totalBytesExpectedToWrite:(NSInteger)totalBytesExpectedToWrite;

@end

/**

  The `FBSDKGraphRequestConnection` represents a single connection to Facebook to service a request.



 The request settings are encapsulated in a reusable <FBSDKGraphRequest> object. The
 `FBSDKGraphRequestConnection` object encapsulates the concerns of a single communication
 e.g. starting a connection, canceling a connection, or batching requests.

 */
NS_SWIFT_NAME(GraphRequestConnection)
@interface FBSDKGraphRequestConnection : NSObject

/**
 The default timeout on all FBSDKGraphRequestConnection instances. Defaults to 60 seconds.
 */
@property (class, nonatomic, assign) NSTimeInterval defaultConnectionTimeout;

/**
  The delegate object that receives updates.
 */
@property (nonatomic, weak, nullable) id<FBSDKGraphRequestConnectionDelegate> delegate;

/**
  Gets or sets the timeout interval to wait for a response before giving up.
 */
@property (nonatomic, assign) NSTimeInterval timeout;

/**
  The raw response that was returned from the server.  (readonly)



 This property can be used to inspect HTTP headers that were returned from
 the server.

 The property is nil until the request completes.  If there was a response
 then this property will be non-nil during the FBSDKGraphRequestBlock callback.
 */
@property (nonatomic, retain, readonly, nullable) NSHTTPURLResponse *urlResponse;

/**
 Determines the operation queue that is used to call methods on the connection's delegate.

 By default, a connection is scheduled on the current thread in the default mode when it is created.
 You cannot reschedule a connection after it has started.
 */
@property (nonatomic, retain) NSOperationQueue *delegateQueue;

/**
 @methodgroup Class methods
 */

/**
 @methodgroup Adding requests
 */

/**
 @method

  This method adds an <FBSDKGraphRequest> object to this connection.

 @param request       A request to be included in the round-trip when start is called.
 @param handler       A handler to call back when the round-trip completes or times out.

 The completion handler is retained until the block is called upon the
 completion or cancellation of the connection.
 */
- (void)addRequest:(FBSDKGraphRequest *)request
 completionHandler:(FBSDKGraphRequestBlock)handler;

/**
 @method

  This method adds an <FBSDKGraphRequest> object to this connection.

 @param request         A request to be included in the round-trip when start is called.

 @param handler         A handler to call back when the round-trip completes or times out.
 The handler will be invoked on the main thread.

 @param name            A name for this request.  This can be used to feed
 the results of one request to the input of another <FBSDKGraphRequest> in the same
 `FBSDKGraphRequestConnection` as described in
 [Graph API Batch Requests]( https://developers.facebook.com/docs/reference/api/batch/ ).

 The completion handler is retained until the block is called upon the
 completion or cancellation of the connection. This request can be named
 to allow for using the request's response in a subsequent request.
 */
- (void)addRequest:(FBSDKGraphRequest *)request
    batchEntryName:(NSString *)name
 completionHandler:(FBSDKGraphRequestBlock)handler;

/**
 @method

  This method adds an <FBSDKGraphRequest> object to this connection.

 @param request         A request to be included in the round-trip when start is called.

 @param handler         A handler to call back when the round-trip completes or times out.

 @param batchParameters The dictionary of parameters to include for this request
 as described in [Graph API Batch Requests]( https://developers.facebook.com/docs/reference/api/batch/ ).
 Examples include "depends_on", "name", or "omit_response_on_success".

 The completion handler is retained until the block is called upon the
 completion or cancellation of the connection. This request can be named
 to allow for using the request's response in a subsequent request.
 */
- (void)addRequest:(FBSDKGraphRequest *)request
   batchParameters:(nullable NSDictionary<NSString *, id> *)batchParameters
 completionHandler:(FBSDKGraphRequestBlock)handler;

/**
 @methodgroup Instance methods
 */

/**
 @method

  Signals that a connection should be logically terminated as the
 application is no longer interested in a response.

 Synchronously calls any handlers indicating the request was cancelled. Cancel
 does not guarantee that the request-related processing will cease. It
 does promise that  all handlers will complete before the cancel returns. A call to
 cancel prior to a start implies a cancellation of all requests associated
 with the connection.
 */
- (void)cancel;

/**
 @method

  This method starts a connection with the server and is capable of handling all of the
 requests that were added to the connection.


 By default, a connection is scheduled on the current thread in the default mode when it is created.
 See `setDelegateQueue:` for other options.

 This method cannot be called twice for an `FBSDKGraphRequestConnection` instance.
 */
- (void)start;

/**
 @method

  Overrides the default version for a batch request

 The SDK automatically prepends a version part, such as "v2.0" to API paths in order to simplify API versioning
 for applications. If you want to override the version part while using batch requests on the connection, call
 this method to set the version for the batch request.

 @param version   This is a string in the form @"v2.0" which will be used for the version part of an API path
 */
- (void)overrideGraphAPIVersion:(NSString *)version;

@end

NS_ASSUME_NONNULL_END
