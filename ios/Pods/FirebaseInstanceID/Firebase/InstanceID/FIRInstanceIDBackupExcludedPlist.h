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

#import <Foundation/Foundation.h>

@interface FIRInstanceIDBackupExcludedPlist : NSObject

/**
 *  Caches the plist contents in memory so we don't hit the disk each time we want
 *  to query something in the plist. This is loaded lazily i.e. if you write to the
 *  plist the contents you want to write will be stored here if the write was
 *  successful. The other case where it is loaded is if you read the plist contents
 *  by calling `contentAsDictionary`.
 *
 *  In case you write to the plist and then try to read the file using
 *  `contentAsDictionary` we would just return the cachedPlistContents since it would
 *  represent the disk contents.
 */
@property(nonatomic, readonly, strong) NSDictionary *cachedPlistContents;

/**
 *  Init a backup excluded plist file.
 *
 *  @param fileName                       The filename for the plist file.
 *  @param subDirectory The subdirectory in Application Support to save the plist.
 *
 *  @return Helper which allows to read write data to a backup excluded plist.
 */
- (instancetype)initWithFileName:(NSString *)fileName subDirectory:(NSString *)subDirectory;

/**
 *  Write dictionary data to the backup excluded plist file. If the file does not exist
 *  it would be created before writing to it.
 *
 *  @param dict  The data to be written to the plist.
 *  @param error The error object if any while writing the data.
 *
 *  @return YES if the write was successful else NO.
 */
- (BOOL)writeDictionary:(NSDictionary *)dict error:(NSError **)error;

/**
 *  Delete the backup excluded plist created with the above filename.
 *
 *  @param error The error object if any while deleting the file.
 *
 *  @return YES If the delete was successful else NO.
 */
- (BOOL)deleteFile:(NSError **)error;

/**
 *  The contents of the plist file. We also store the contents of the file in-memory.
 *  If the in-memory contents are valid we return the in-memory contents else we read
 *  the file from disk.
 *
 *  @return A dictionary object that contains the contents of the plist file if the file
 *          exists else nil.
 */
- (NSDictionary *)contentAsDictionary;

/**
 *  Check if the plist exists on the disk or not.
 *
 *  @return YES if the file exists on the disk else NO.
 */
- (BOOL)doesFileExist;

@end
