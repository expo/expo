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

#import "FBSDKBoltsMeasurementEventListener.h"

#import "FBSDKAppEvents+Internal.h"
#import "FBSDKTimeSpentData.h"

static NSString *const BoltsMeasurementEventNotificationName = @"com.parse.bolts.measurement_event";
static NSString *const BoltsMeasurementEventName = @"event_name";
static NSString *const BoltsMeasurementEventArgs = @"event_args";
static NSString *const BoltsMeasurementEventPrefix = @"bf_";

@implementation FBSDKBoltsMeasurementEventListener

+ (instancetype)defaultListener
{
    static dispatch_once_t dispatchOnceLocker = 0;
    static FBSDKBoltsMeasurementEventListener *defaultListener = nil;
    dispatch_once(&dispatchOnceLocker, ^{
        defaultListener = [[self alloc] init];
        NSNotificationCenter *center = [NSNotificationCenter defaultCenter];
        [center addObserver:defaultListener
                   selector:@selector(logFBAppEventForNotification:)
                       name:BoltsMeasurementEventNotificationName
                     object:nil];
    });
    return defaultListener;
}

- (void)logFBAppEventForNotification:(NSNotification *)note
{
    // when catch al_nav_in event, we set source application for FBAppEvents.
    if ([note.userInfo[BoltsMeasurementEventName] isEqualToString:@"al_nav_in"]) {
        NSString *sourceApplication = note.userInfo[BoltsMeasurementEventArgs][@"sourceApplication"];
        if (sourceApplication) {
            [FBSDKTimeSpentData setSourceApplication:sourceApplication isFromAppLink:YES];
        }
    }
    NSDictionary *eventArgs = note.userInfo[BoltsMeasurementEventArgs];
    NSMutableDictionary *logData = [[NSMutableDictionary alloc] init];
    for(NSString *key in eventArgs.allKeys) {
        NSError *error = nil;
        NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"[^0-9a-zA-Z _-]" options:0 error:&error];
        NSString *safeKey = [regex stringByReplacingMatchesInString:key
                                                            options:0
                                                              range:NSMakeRange(0, [key length])
                                                       withTemplate:@"-"];
        safeKey = [safeKey stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@" -"]];
        logData[safeKey] = eventArgs[key];
    }
    [FBSDKAppEvents logImplicitEvent:[BoltsMeasurementEventPrefix stringByAppendingString:note.userInfo[BoltsMeasurementEventName]]
                          valueToSum:nil
                          parameters:logData
                         accessToken:nil];
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
