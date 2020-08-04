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

#import "FIRIMessageCode.h"

// The convenience macros are only defined if they haven't already been defined.
#ifndef FIRInstanceIDLoggerInfo

// Convenience macros that log to the shared GTMLogger instance. These macros
// are how users should typically log to FIRInstanceIDLogger.
#define FIRInstanceIDLoggerDebug(code, ...) \
  [FIRInstanceIDSharedLogger() logFuncDebug:__func__ messageCode:code msg:__VA_ARGS__]
#define FIRInstanceIDLoggerInfo(code, ...) \
  [FIRInstanceIDSharedLogger() logFuncInfo:__func__ messageCode:code msg:__VA_ARGS__]
#define FIRInstanceIDLoggerNotice(code, ...) \
  [FIRInstanceIDSharedLogger() logFuncNotice:__func__ messageCode:code msg:__VA_ARGS__]
#define FIRInstanceIDLoggerWarning(code, ...) \
  [FIRInstanceIDSharedLogger() logFuncWarning:__func__ messageCode:code msg:__VA_ARGS__]
#define FIRInstanceIDLoggerError(code, ...) \
  [FIRInstanceIDSharedLogger() logFuncError:__func__ messageCode:code msg:__VA_ARGS__]

#endif  // !defined(FIRInstanceIDLoggerInfo)

@interface FIRInstanceIDLogger : NSObject

- (void)logFuncDebug:(const char *)func
         messageCode:(FIRInstanceIDMessageCode)messageCode
                 msg:(NSString *)fmt, ... NS_FORMAT_FUNCTION(3, 4);

- (void)logFuncInfo:(const char *)func
        messageCode:(FIRInstanceIDMessageCode)messageCode
                msg:(NSString *)fmt, ... NS_FORMAT_FUNCTION(3, 4);

- (void)logFuncNotice:(const char *)func
          messageCode:(FIRInstanceIDMessageCode)messageCode
                  msg:(NSString *)fmt, ... NS_FORMAT_FUNCTION(3, 4);

- (void)logFuncWarning:(const char *)func
           messageCode:(FIRInstanceIDMessageCode)messageCode
                   msg:(NSString *)fmt, ... NS_FORMAT_FUNCTION(3, 4);

- (void)logFuncError:(const char *)func
         messageCode:(FIRInstanceIDMessageCode)messageCode
                 msg:(NSString *)fmt, ... NS_FORMAT_FUNCTION(3, 4);

@end

/**
 * Instantiates and/or returns a shared GTMLogger used exclusively
 * for InstanceID log messages.
 * @return the shared GTMLogger instance
 */
FIRInstanceIDLogger *FIRInstanceIDSharedLogger(void);
