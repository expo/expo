/* Copyright 2014 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GTMReadMonitorInputStream.h"

@implementation GTMReadMonitorInputStream {
  NSInputStream *_inputStream; // Encapsulated stream that does the work.

  NSThread *_thread;      // Thread in which this object was created.
  NSArray *_runLoopModes; // Modes for calling callbacks, when necessary.
}


@synthesize readDelegate = _readDelegate;
@synthesize readSelector = _readSelector;
@synthesize runLoopModes = _runLoopModes;

// We'll forward all unhandled messages to the NSInputStream class or to the encapsulated input
// stream.  This is needed for all messages sent to NSInputStream which aren't handled by our
// superclass; that includes various private run loop calls.
+ (NSMethodSignature *)methodSignatureForSelector:(SEL)selector {
  return [NSInputStream methodSignatureForSelector:selector];
}

+ (void)forwardInvocation:(NSInvocation*)invocation {
  [invocation invokeWithTarget:[NSInputStream class]];
}

- (BOOL)respondsToSelector:(SEL)selector {
  return [_inputStream respondsToSelector:selector];
}

- (NSMethodSignature*)methodSignatureForSelector:(SEL)selector {
  return [_inputStream methodSignatureForSelector:selector];
}

- (void)forwardInvocation:(NSInvocation*)invocation {
  [invocation invokeWithTarget:_inputStream];
}

#pragma mark -

+ (instancetype)inputStreamWithStream:(NSInputStream *)input {
  return [[self alloc] initWithStream:input];
}

- (instancetype)initWithStream:(NSInputStream *)input  {
  self = [super init];
  if (self) {
    _inputStream = input;
    _thread = [NSThread currentThread];
  }
  return self;
}

- (instancetype)init {
  [self doesNotRecognizeSelector:_cmd];
  return nil;
}

#pragma mark -

- (NSInteger)read:(uint8_t *)buffer maxLength:(NSUInteger)len {
  // Read from the encapsulated stream.
  NSInteger numRead = [_inputStream read:buffer maxLength:len];
  if (numRead > 0) {
    if (_readDelegate && _readSelector) {
      // Call the read selector with the buffer and number of bytes actually read into it.
      BOOL isOnOriginalThread = [_thread isEqual:[NSThread currentThread]];
      if (isOnOriginalThread) {
        // Invoke immediately.
        NSData *data = [NSData dataWithBytesNoCopy:buffer
                                            length:(NSUInteger)numRead
                                      freeWhenDone:NO];
        [self invokeReadSelectorWithBuffer:data];
      } else {
        // Copy the buffer into an NSData to be retained by the performSelector,
        // and invoke on the proper thread.
        SEL sel = @selector(invokeReadSelectorWithBuffer:);
        NSData *data = [NSData dataWithBytes:buffer length:(NSUInteger)numRead];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
        if (_runLoopModes) {
          [self performSelector:sel
                       onThread:_thread
                     withObject:data
                  waitUntilDone:NO
                          modes:_runLoopModes];
        } else {
          [self performSelector:sel
                       onThread:_thread
                     withObject:data
                  waitUntilDone:NO];
        }
#pragma clang diagnostic pop
      }
    }
  }
  return numRead;
}

- (void)invokeReadSelectorWithBuffer:(NSData *)data {
  const void *buffer = data.bytes;
  int64_t length = (int64_t)data.length;

  id argSelf = self;
  id readDelegate = _readDelegate;
  if (readDelegate) {
    NSMethodSignature *signature = [readDelegate methodSignatureForSelector:_readSelector];
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:signature];
    [invocation setSelector:_readSelector];
    [invocation setTarget:readDelegate];
    [invocation setArgument:&argSelf atIndex:2];
    [invocation setArgument:&buffer atIndex:3];
    [invocation setArgument:&length atIndex:4];
    [invocation invoke];
  }
}

- (BOOL)getBuffer:(uint8_t **)buffer length:(NSUInteger *)len {
  return [_inputStream getBuffer:buffer length:len];
}

- (BOOL)hasBytesAvailable {
  return [_inputStream hasBytesAvailable];
}

#pragma mark Standard messages

// Pass expected messages to our encapsulated stream.
//
// We want our encapsulated NSInputStream to handle the standard messages;
// we don't want the superclass to handle them.
- (void)open {
  [_inputStream open];
}

- (void)close {
  [_inputStream close];
}

- (id)delegate {
  return [_inputStream delegate];
}

- (void)setDelegate:(id)delegate {
  [_inputStream setDelegate:delegate];
}

- (id)propertyForKey:(NSString *)key {
  return [_inputStream propertyForKey:key];
}

- (BOOL)setProperty:(id)property forKey:(NSString *)key {
  return [_inputStream setProperty:property forKey:key];
}

- (void)scheduleInRunLoop:(NSRunLoop *)aRunLoop forMode:(NSString *)mode {
  [_inputStream scheduleInRunLoop:aRunLoop forMode:mode];
}

- (void)removeFromRunLoop:(NSRunLoop *)aRunLoop forMode:(NSString *)mode {
  [_inputStream removeFromRunLoop:aRunLoop forMode:mode];
}

- (NSStreamStatus)streamStatus {
  return [_inputStream streamStatus];
}

- (NSError *)streamError {
  return [_inputStream streamError];
}

@end
