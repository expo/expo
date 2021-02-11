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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKAudioResourceLoader.h"

 #import "FBSDKDynamicFrameworkLoader.h"
 #import "FBSDKInternalUtility.h"
 #import "FBSDKLogger.h"
 #import "FBSDKSettings.h"

@implementation FBSDKAudioResourceLoader
{
  NSFileManager *_fileManager;
  NSURL *_fileURL;
  SystemSoundID _systemSoundID;
}

 #pragma mark - Class Methods

+ (instancetype)sharedLoader
{
  static NSMutableDictionary *_loaderCache = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _loaderCache = [[NSMutableDictionary alloc] init];
  });

  NSString *name = [self name];
  FBSDKAudioResourceLoader *loader;
  @synchronized(_loaderCache) {
    loader = _loaderCache[name];
    if (!loader) {
      loader = [[self alloc] init];
      NSError *error = nil;
      if ([loader loadSound:&error]) {
        [FBSDKTypeUtility dictionary:_loaderCache setObject:loader forKey:name];
      } else {
        [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                           formatString:@"%@ error: %@", self, error];
      }
    }
  }

  return loader;
}

 #pragma mark - Object Lifecycle

- (instancetype)init
{
  if ((self = [super init])) {
    _fileManager = [[NSFileManager alloc] init];
  }
  return self;
}

- (void)dealloc
{
  fbsdkdfl_AudioServicesDisposeSystemSoundID(_systemSoundID);
}

 #pragma mark - Public API

- (BOOL)loadSound:(NSError **)errorRef
{
  NSURL *fileURL = [self _fileURL:errorRef];

  if (![_fileManager fileExistsAtPath:fileURL.path]) {
    NSData *data = [[self class] data];
    if (![data writeToURL:fileURL options:NSDataWritingAtomic error:errorRef]) {
      return NO;
    }
  }

  OSStatus status = fbsdkdfl_AudioServicesCreateSystemSoundID((__bridge CFURLRef)fileURL, &_systemSoundID);
  return (status == kAudioServicesNoError);
}

- (void)playSound
{
  if ((_systemSoundID == 0) && ![self loadSound:NULL]) {
    return;
  }
  fbsdkdfl_AudioServicesPlaySystemSound(_systemSoundID);
}

 #pragma mark - Helper Methods

- (NSURL *)_fileURL:(NSError **)errorRef
{
  if (_fileURL) {
    return _fileURL;
  }

  NSURL *baseURL = [_fileManager URLForDirectory:NSCachesDirectory
                                        inDomain:NSUserDomainMask
                               appropriateForURL:nil
                                          create:YES
                                           error:errorRef];
  if (!baseURL) {
    return nil;
  }

  NSURL *directoryURL = [baseURL URLByAppendingPathComponent:@"fb_audio" isDirectory:YES];
  NSURL *versionURL = [directoryURL URLByAppendingPathComponent:[NSString stringWithFormat:@"%lu", (unsigned long)[[self class] version]]
                                                    isDirectory:YES];
  if (![_fileManager createDirectoryAtURL:versionURL withIntermediateDirectories:YES attributes:nil error:errorRef]) {
    return nil;
  }

  _fileURL = [[versionURL URLByAppendingPathComponent:[[self class] name]] copy];

  return _fileURL;
}

@end

@implementation FBSDKAudioResourceLoader (Subclass)

 #pragma mark - Subclass Methods

+ (NSString *)name
{
  return nil;
}

+ (NSUInteger)version
{
  return 0;
}

+ (NSData *)data
{
  return nil;
}

@end

#endif
