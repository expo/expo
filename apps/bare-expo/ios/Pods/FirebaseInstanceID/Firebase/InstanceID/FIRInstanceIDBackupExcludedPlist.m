/*
 * Copyright 2019 Google
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "FIRInstanceIDBackupExcludedPlist.h"

#import "FIRInstanceIDLogger.h"

@interface FIRInstanceIDBackupExcludedPlist ()

@property(nonatomic, readwrite, copy) NSString *fileName;
@property(nonatomic, readwrite, copy) NSString *subDirectoryName;
@property(nonatomic, readwrite, strong) NSDictionary *cachedPlistContents;

@end

@implementation FIRInstanceIDBackupExcludedPlist

- (instancetype)initWithFileName:(NSString *)fileName subDirectory:(NSString *)subDirectory {
  self = [super init];
  if (self) {
    _fileName = [fileName copy];
    _subDirectoryName = [subDirectory copy];
  }
  return self;
}

- (BOOL)writeDictionary:(NSDictionary *)dict error:(NSError **)error {
  NSString *path = [self plistPathInDirectory];
  if (![dict writeToFile:path atomically:YES]) {
    FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeBackupExcludedPlist000,
                             @"Failed to write to %@.plist", self.fileName);
    return NO;
  }

  // Successfully wrote contents -- change the in-memory contents
  self.cachedPlistContents = [dict copy];

  NSURL *URL = [NSURL fileURLWithPath:path];
  if (error) {
    *error = nil;
  }

  NSDictionary *preferences = [URL resourceValuesForKeys:@[ NSURLIsExcludedFromBackupKey ]
                                                   error:error];
  if ([preferences[NSURLIsExcludedFromBackupKey] boolValue]) {
    return YES;
  }

  BOOL success = [URL setResourceValue:@(YES) forKey:NSURLIsExcludedFromBackupKey error:error];
  if (!success) {
    FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeBackupExcludedPlist001,
                             @"Error excluding %@ from backup, %@", [URL lastPathComponent],
                             error ? *error : @"");
  }
  return success;
}

- (BOOL)deleteFile:(NSError **)error {
  BOOL success = YES;
  NSString *path = [self plistPathInDirectory];
  if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
    success = [[NSFileManager defaultManager] removeItemAtPath:path error:error];
  }
  // remove the in-memory contents
  self.cachedPlistContents = nil;
  return success;
}

- (NSDictionary *)contentAsDictionary {
  if (!self.cachedPlistContents) {
    NSString *path = [self plistPathInDirectory];
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
      self.cachedPlistContents = [[NSDictionary alloc] initWithContentsOfFile:path];
    }
  }
  return self.cachedPlistContents;
}

- (BOOL)doesFileExist {
  NSString *path = [self plistPathInDirectory];
  return [[NSFileManager defaultManager] fileExistsAtPath:path];
}

#pragma mark - Private

- (NSString *)plistPathInDirectory {
  NSArray *directoryPaths;
  NSString *plistNameWithExtension = [NSString stringWithFormat:@"%@.plist", self.fileName];
  directoryPaths =
      NSSearchPathForDirectoriesInDomains([self supportedDirectory], NSUserDomainMask, YES);
  NSArray *components = @[ directoryPaths.lastObject, _subDirectoryName, plistNameWithExtension ];

  return [NSString pathWithComponents:components];
}

- (NSSearchPathDirectory)supportedDirectory {
#if TARGET_OS_TV
  return NSCachesDirectory;
#else
  return NSApplicationSupportDirectory;
#endif
}

@end
