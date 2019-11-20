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

#import "FBSDKAppEventsStateManager.h"

#import <Foundation/Foundation.h>

#import "FBSDKAppEventsState.h"
#import "FBSDKAppEventsUtility.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings.h"

// A quick optimization to allow returning empty array if we know there are no persisted events.
static BOOL g_canSkipDiskCheck = NO;

@implementation FBSDKAppEventsStateManager

+ (void)clearPersistedAppEventsStates
{
  [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorAppEvents
                         logEntry:@"FBSDKAppEvents Persist: Clearing"];
  [[NSFileManager defaultManager] removeItemAtPath:[[self class] filePath]
                                             error:NULL];
  g_canSkipDiskCheck = YES;
}

+ (void)persistAppEventsData:(FBSDKAppEventsState *)appEventsState
{
  [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorAppEvents
                     formatString:@"FBSDKAppEvents Persist: Writing %lu events", (unsigned long)appEventsState.events.count];

  if (!appEventsState.events.count) {
    return;
  }
  NSMutableArray *existingEvents = [NSMutableArray arrayWithArray:[[self class] retrievePersistedAppEventsStates]];
  [existingEvents addObject:appEventsState];

  [NSKeyedArchiver archiveRootObject:existingEvents toFile:[[self class] filePath]];
  g_canSkipDiskCheck = NO;
}

+ (NSArray *)retrievePersistedAppEventsStates
{
  NSMutableArray *eventsStates = [NSMutableArray array];
  if (!g_canSkipDiskCheck) {
    [eventsStates addObjectsFromArray:[NSKeyedUnarchiver unarchiveObjectWithFile:[[self class] filePath]]];

    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorAppEvents
                       formatString:@"FBSDKAppEvents Persist: Read %lu event states. First state has %lu events",
     (unsigned long)eventsStates.count,
     (unsigned long)(eventsStates.count > 0 ? ((FBSDKAppEventsState *)eventsStates[0]).events.count : 0)];
    [[self class] clearPersistedAppEventsStates];
  }
  return eventsStates;
}

#pragma mark - Private Helpers

+ (NSString *)filePath
{
  return [FBSDKBasicUtility persistenceFilePath:@"com-facebook-sdk-AppEventsPersistedEvents.json"];
}
@end
