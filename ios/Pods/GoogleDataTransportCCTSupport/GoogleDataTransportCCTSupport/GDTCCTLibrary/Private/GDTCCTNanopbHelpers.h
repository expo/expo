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

#import <GoogleDataTransport/GDTStoredEvent.h>

#import "GDTCCTLibrary/Protogen/nanopb/cct.nanopb.h"

NS_ASSUME_NONNULL_BEGIN

#pragma mark - General purpose encoders

/** Converts an NSString* to a pb_bytes_array_t*.
 *
 * @note malloc is called in this method. Ensure that pb_release is called on this or the parent.
 *
 * @param string The string to convert.
 * @return A newly allocated array of bytes representing the UTF8 encoding of the string.
 */
pb_bytes_array_t *GDTCCTEncodeString(NSString *string);

/** Converts an NSData to a pb_bytes_array_t*.
 *
 * @note malloc is called in this method. Ensure that pb_release is called on this or the parent.
 *
 * @param data The data to convert.
 * @return A newly allocated array of bytes with [data bytes] copied into it.
 */
pb_bytes_array_t *GDTCCTEncodeData(NSData *data);

#pragma mark - CCT object constructors

/** Encodes a batched log request.
 *
 * @note Ensure that pb_release is called on the batchedLogRequest param.
 *
 * @param batchedLogRequest A pointer to the log batch to encode to bytes.
 * @return An NSData object representing the bytes of the log request batch.
 */
FOUNDATION_EXPORT
NSData *GDTCCTEncodeBatchedLogRequest(gdt_cct_BatchedLogRequest *batchedLogRequest);

/** Constructs a gdt_cct_BatchedLogRequest given sets of events segemented by mapping ID.
 *
 * @note malloc is called in this method. Ensure that pb_release is called on this or the parent.
 *
 * @param logMappingIDToLogSet A map of mapping IDs to sets of events to convert into a batch.
 * @return A newly created gdt_cct_BatchedLogRequest.
 */
FOUNDATION_EXPORT
gdt_cct_BatchedLogRequest GDTCCTConstructBatchedLogRequest(
    NSDictionary<NSString *, NSSet<GDTStoredEvent *> *> *logMappingIDToLogSet);

/** Constructs a log request given a log source and a set of events.
 *
 * @note malloc is called in this method. Ensure that pb_release is called on this or the parent.
 * @param logSource The CCT log source to put into the log request.
 * @param logSet The set of events to send in this log request.
 */
FOUNDATION_EXPORT
gdt_cct_LogRequest GDTCCTConstructLogRequest(int32_t logSource, NSSet<GDTStoredEvent *> *logSet);

/** Constructs a gdt_cct_LogEvent given a GDTStoredEvent*.
 *
 * @param event The GDTStoredEvent to convert.
 * @return The new gdt_cct_LogEvent object.
 */
FOUNDATION_EXPORT
gdt_cct_LogEvent GDTCCTConstructLogEvent(GDTStoredEvent *event);

/** Constructs a gdt_cct_ClientInfo representing the client device.
 *
 * @return The new gdt_cct_ClientInfo object.
 */
FOUNDATION_EXPORT
gdt_cct_ClientInfo GDTCCTConstructClientInfo(void);

/** Constructs a gdt_cct_IosClientInfo representing the client device.
 *
 * @return The new gdt_cct_IosClientInfo object.
 */
FOUNDATION_EXPORT
gdt_cct_IosClientInfo GDTCCTConstructiOSClientInfo(void);

#pragma mark - CCT object decoders

/** Decodes a gdt_cct_LogResponse given proto bytes.
 *
 * @note malloc is called in this method. Ensure that pb_release is called on the return value.
 *
 * @param data The proto bytes of the gdt_cct_LogResponse.
 * @param error An error that will be populated if something went wrong during decoding.
 * @return A newly allocated gdt_cct_LogResponse from the data, if the bytes decoded properly.
 */
FOUNDATION_EXPORT
gdt_cct_LogResponse GDTCCTDecodeLogResponse(NSData *data, NSError **error);

NS_ASSUME_NONNULL_END
