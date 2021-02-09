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

#import "GoogleUtilities/Environment/Private/GULHeartbeatDateStorage.h"
#import "GoogleUtilities/Environment/Private/GULSecureCoding.h"

@interface GULHeartbeatDateStorage ()
/** The storage to store the date of the last sent heartbeat. */
@property(nonatomic, readonly) NSFileCoordinator *fileCoordinator;
/** The name of the file that stores heartbeat information. */
@property(nonatomic, readonly) NSString *fileName;
@end

@implementation GULHeartbeatDateStorage

@synthesize fileURL = _fileURL;

- (instancetype)initWithFileName:(NSString *)fileName {
  if (fileName == nil) {
    return nil;
  }

  self = [super init];
  if (self) {
    _fileCoordinator = [[NSFileCoordinator alloc] initWithFilePresenter:nil];
    _fileName = fileName;
  }
  return self;
}

/** Lazy getter for fileURL
 * @return fileURL where heartbeat information is stored.
 */
- (NSURL *)fileURL {
  if (!_fileURL) {
    NSURL *directoryURL = [[self class] directoryPathURL];
    [[self class] checkAndCreateDirectory:directoryURL fileCoordinator:_fileCoordinator];
    _fileURL = [directoryURL URLByAppendingPathComponent:_fileName];
  }
  return _fileURL;
}

/** Returns the URL path of the Application Support folder.
 * @return the URL path of Application Support.
 */
+ (NSURL *)directoryPathURL {
  NSArray<NSString *> *paths =
      NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES);
  NSArray<NSString *> *components = @[ paths.lastObject, @"Google/FIRApp" ];
  NSString *directoryString = [NSString pathWithComponents:components];
  NSURL *directoryURL = [NSURL fileURLWithPath:directoryString];
  return directoryURL;
}

/** Checks and creates a directory for the directory specified by the
 * directory url
 * @param directoryPathURL The path to the directory which needs to be created.
 * @param fileCoordinator The fileCoordinator object to coordinate writes to the directory.
 */
+ (void)checkAndCreateDirectory:(NSURL *)directoryPathURL
                fileCoordinator:(NSFileCoordinator *)fileCoordinator {
  NSError *fileCoordinatorError = nil;
  [fileCoordinator
      coordinateWritingItemAtURL:directoryPathURL
                         options:0
                           error:&fileCoordinatorError
                      byAccessor:^(NSURL *writingDirectoryURL) {
                        NSError *error;
                        if (![writingDirectoryURL checkResourceIsReachableAndReturnError:&error]) {
                          // If fail creating the Application Support directory, log warning.
                          NSError *error;
                          [[NSFileManager defaultManager] createDirectoryAtURL:writingDirectoryURL
                                                   withIntermediateDirectories:YES
                                                                    attributes:nil
                                                                         error:&error];
                        }
                      }];
}

- (nullable NSMutableDictionary *)heartbeatDictionaryWithFileURL:(NSURL *)readingFileURL {
  NSError *error;
  NSMutableDictionary *dict;
  NSData *objectData = [NSData dataWithContentsOfURL:readingFileURL options:0 error:&error];
  if (objectData == nil || error != nil) {
    dict = [NSMutableDictionary dictionary];
  } else {
    dict = [GULSecureCoding
        unarchivedObjectOfClasses:[NSSet setWithArray:@[ NSDictionary.class, NSDate.class ]]
                         fromData:objectData
                            error:&error];
    if (dict == nil || error != nil) {
      dict = [NSMutableDictionary dictionary];
    }
  }
  return dict;
}

- (nullable NSDate *)heartbeatDateForTag:(NSString *)tag {
  __block NSMutableDictionary *dict;
  NSError *error;
  [self.fileCoordinator coordinateReadingItemAtURL:self.fileURL
                                           options:0
                                             error:&error
                                        byAccessor:^(NSURL *readingURL) {
                                          dict = [self heartbeatDictionaryWithFileURL:readingURL];
                                        }];
  return dict[tag];
}

- (BOOL)setHearbeatDate:(NSDate *)date forTag:(NSString *)tag {
  NSError *error;
  __block BOOL isSuccess = false;
  [self.fileCoordinator coordinateReadingItemAtURL:self.fileURL
                                           options:0
                                  writingItemAtURL:self.fileURL
                                           options:0
                                             error:&error
                                        byAccessor:^(NSURL *readingURL, NSURL *writingURL) {
                                          NSMutableDictionary *dictionary =
                                              [self heartbeatDictionaryWithFileURL:readingURL];
                                          dictionary[tag] = date;
                                          NSError *error;
                                          isSuccess = [self writeDictionary:dictionary
                                                              forWritingURL:writingURL
                                                                      error:&error];
                                        }];
  return isSuccess;
}

- (BOOL)writeDictionary:(NSMutableDictionary *)dictionary
          forWritingURL:(NSURL *)writingFileURL
                  error:(NSError **)outError {
  NSData *data = [GULSecureCoding archivedDataWithRootObject:dictionary error:outError];
  if (*outError != nil) {
    return false;
  } else {
    return [data writeToURL:writingFileURL atomically:YES];
  }
}

@end
