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

#import "FBSDKMeasurementEvent_Internal.h"

NSString *const FBSDKMeasurementEventNotificationName = @"com.facebook.facebook-objc-sdk.measurement_event";

NSString *const FBSDKMeasurementEventNameKey = @"event_name";
NSString *const FBSDKMeasurementEventArgsKey = @"event_args";

/* app Link Event raised by this FBSDKURL */
NSString *const FBSDKAppLinkParseEventName = @"al_link_parse";
NSString *const FBSDKAppLinkNavigateInEventName = @"al_nav_in";

/*! AppLink events raised in this class */
NSString *const FBSDKAppLinkNavigateOutEventName = @"al_nav_out";
NSString *const FBSDKAppLinkNavigateBackToReferrerEventName = @"al_ref_back_out";

@implementation FBSDKMeasurementEvent {
    NSString *_name;
    NSDictionary<NSString *, id> *_args;
}

- (void)postNotification {
    if (!_name) {
      NSLog(@"Warning: Missing event name when logging FBSDK measurement event. \n"
            " Ignoring this event in logging.");
        return;
    }
    NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
    NSDictionary<NSString *, id> *userInfo = @{FBSDKMeasurementEventNameKey : _name,
                                               FBSDKMeasurementEventArgsKey : _args};

    [center postNotificationName:FBSDKMeasurementEventNotificationName
                          object:self
                        userInfo:userInfo];
}

- (instancetype)initEventWithName:(NSString *)name
                             args:(NSDictionary<NSString *, id> *)args {
    if ((self = [super init])) {
        _name = name;
        _args = args ? args : @{};
    }
    return self;
}

+ (void)postNotificationForEventName:(NSString *)name
                                args:(NSDictionary<NSString *, id> *)args {
    [[[self alloc] initEventWithName:name args:args] postNotification];
}

@end
