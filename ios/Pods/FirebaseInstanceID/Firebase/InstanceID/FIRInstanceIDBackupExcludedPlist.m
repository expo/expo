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

typedef enum : NSUInteger {
  FIRInstanceIDPlistDirectoryUnknown,
  FIRInstanceIDPlistDirectoryDocuments,
  FIRInstanceIDPlistDirectoryApplicationSupport,
} FIRInstanceIDPlistDirectory;

@interface FIRInstanceIDBackupExcludedPlist ()

@property(nonatomic, readwrite, copy) NSString *fileName;
@property(nonatomic, readwrite, copy) NSString *subDirectoryName;
@property(nonatomic, readwrite, assign) BOOL fileInStandardDirectory;

@property(nonatomic, readwrite, strong) NSDictionary *cachedPlistContents;

@end

@implementation FIRInstanceIDBackupExcludedPlist

- (instancetype)initWithFileName:(NSString *)fileName subDirectory:(NSString *)subDirectory {
  self = [super init];
  if (self) {
    _fileName = [fileName copy];
    _subDirectoryName = [subDirectory copy];
#if TARGET_OS_IOS
    _fileInStandardDirectory = [self moveToApplicationSupportSubDirectory:subDirectory];
#else
    // For tvOS and macOS, we never store the content in document folder, so
    // the migration is unnecessary.
    _fileInStandardDirectory = YES;
#endif
  }
  return self;
}

- (BOOL)writeDictionary:(NSDictionary *)dict error:(NSError **)error {
  NSString *path = [self plistPathInDirectory:[self plistDirectory]];
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
  NSString *path = [self plistPathInDirectory:[self plistDirectory]];
  if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
    success = [[NSFileManager defaultManager] removeItemAtPath:path error:error];
  }
  // remove the in-memory contents
  self.cachedPlistContents = nil;
  return success;
}

- (NSDictionary *)contentAsDictionary {
  if (!self.cachedPlistContents) {
    NSString *path = [self plistPathInDirectory:[self plistDirectory]];
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
      self.cachedPlistContents = [[NSDictionary alloc] initWithContentsOfFile:path];
    }
  }
  return self.cachedPlistContents;
}

- (BOOL)moveToApplicationSupportSubDirectory:(NSString *)subDirectoryName {
  NSArray *directoryPaths =
      NSSearchPathForDirectoriesInDomains([self supportedDirectory], NSUserDomainMask, YES);
  // This only going to happen inside iOS so it is an applicationSupportDirectory.
  NSString *applicationSupportDirPath = directoryPaths.lastObject;
  NSArray *components = @[ applicationSupportDirPath, subDirectoryName ];
  NSString *subDirectoryPath = [NSString pathWithComponents:components];
  BOOL hasSubDirectory;
  if (![[NSFileManager defaultManager] fileExistsAtPath:subDirectoryPath
                                            isDirectory:&hasSubDirectory]) {
    // Cannot move to non-existent directory
    return NO;
  }

  if ([self doesFileExistInDirectory:FIRInstanceIDPlistDirectoryDocuments]) {
    NSString *oldPlistPath = [self plistPathInDirectory:FIRInstanceIDPlistDirectoryDocuments];
    NSString *newPlistPath =
        [self plistPathInDirectory:FIRInstanceIDPlistDirectoryApplicationSupport];
    if ([self doesFileExistInDirectory:FIRInstanceIDPlistDirectoryApplicationSupport]) {
      // File exists in both Documents and ApplicationSupport
      return NO;
    }
    NSError *moveError;
    if (![[NSFileManager defaultManager] moveItemAtPath:oldPlistPath
                                                 toPath:newPlistPath
                                                  error:&moveError]) {
      FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeBackupExcludedPlist002,
                               @"Failed to move file %@ from %@ to %@. Error: %@", self.fileName,
                               oldPlistPath, newPlistPath, moveError);
      return NO;
    }
  }
  // We moved the file if it existed, otherwise we didn't need to do anything
  return YES;
}

- (BOOL)doesFileExist {
  return [self doesFileExistInDirectory:[self plistDirectory]];
}

#pragma mark - Private

- (FIRInstanceIDPlistDirectory)plistDirectory {
  if (_fileInStandardDirectory) {
    return FIRInstanceIDPlistDirectoryApplicationSupport;
  } else {
    return FIRInstanceIDPlistDirectoryDocuments;
  };
}

- (NSString *)plistPathInDirectory:(FIRInstanceIDPlistDirectory)directory {
  return [self pathWithName:self.fileName inDirectory:directory];
}

- (NSString *)pathWithName:(NSString *)plistName
               inDirectory:(FIRInstanceIDPlistDirectory)directory {
  NSArray *directoryPaths;
  NSArray *components = @[];
  NSString *plistNameWithExtension = [NSString stringWithFormat:@"%@.plist", plistName];
  switch (directory) {
    case FIRInstanceIDPlistDirectoryDocuments:
      directoryPaths =
          NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
      components = @[ directoryPaths.lastObject, plistNameWithExtension ];
      break;

    case FIRInstanceIDPlistDirectoryApplicationSupport:
      directoryPaths =
          NSSearchPathForDirectoriesInDomains([self supportedDirectory], NSUserDomainMask, YES);
      components = @[ directoryPaths.lastObject, _subDirectoryName, plistNameWithExtension ];
      break;

    default:
      FIRInstanceIDLoggerError(kFIRInstanceIDMessageCodeBackupExcludedPlistInvalidPlistEnum,
                               @"Invalid plist directory type: %lu", (unsigned long)directory);
      NSAssert(NO, @"Invalid plist directory type: %lu", (unsigned long)directory);
      break;
  }

  return [NSString pathWithComponents:components];
}

- (BOOL)doesFileExistInDirectory:(FIRInstanceIDPlistDirectory)directory {
  NSString *path = [self plistPathInDirectory:directory];
  return [[NSFileManager defaultManager] fileExistsAtPath:path];
}

- (NSSearchPathDirectory)supportedDirectory {
#if TARGET_OS_TV
  return NSCachesDirectory;
#else
  return NSApplicationSupportDirectory;
#endif
}

@end
