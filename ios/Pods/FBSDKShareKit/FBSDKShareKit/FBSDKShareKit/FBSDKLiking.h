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

/**
  The common interface for components that initiate liking.

- See:FBSDKLikeButton

- See:FBSDKLikeControl
 */
@protocol FBSDKLiking <NSObject>

/**
  The objectID for the object to like.


 This value may be an Open Graph object ID or a string representation of an URL that describes an
 Open Graph object.  The objects may be public objects, like pages, or objects that are defined by your application.
 */
@property (nonatomic, copy) NSString *objectID;

/**
  The type of object referenced by the objectID.


 If the objectType is unknown, the control will determine the objectType by querying the server with the
 objectID.  Specifying a value for the objectType is an optimization that should be used if the type is known by the
 consumer.  Consider setting the objectType if it is known when setting the objectID.
 */
@property (nonatomic, assign) FBSDKLikeObjectType objectType;

@end
