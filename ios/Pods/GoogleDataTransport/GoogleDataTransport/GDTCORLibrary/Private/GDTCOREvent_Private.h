/*
 * Copyright 2018 Google
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

#import <GoogleDataTransport/GDTCOREvent.h>

#import <GoogleDataTransport/GDTCORClock.h>

NS_ASSUME_NONNULL_BEGIN

@interface GDTCOREvent ()

/** The unique ID of the event. This property is for testing only. */
@property(nonatomic, readwrite) NSNumber *eventID;

/** The GDT relative file path of the event. */
@property(nullable, nonatomic, readonly) NSString *GDTFilePath;

/** Writes [dataObject transportBytes] to the given URL, populates fileURL with the filename, then
 * nils the dataObject property. This method should not be called twice on the same event.
 *
 * @param filePath The GDTCORRootDirectory-relative path that dataObject will be written to.
 * @param error If populated, the error encountered during writing to disk.
 * @return YES if writing dataObject to disk was successful, NO otherwise.
 */
- (BOOL)writeToGDTPath:(NSString *)filePath error:(NSError **)error;

/** Generates incrementing event IDs, stored in a file in the app's cache.
 *
 * @return An event ID that is incremented based on a number in a file stored in the app cache.
 */
+ (NSNumber *)nextEventID;

@end

NS_ASSUME_NONNULL_END
