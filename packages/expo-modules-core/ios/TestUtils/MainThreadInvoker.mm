// Copyright 2023-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <ExpoModulesCore/MainThreadInvoker.h>
#import <Foundation/Foundation.h>

void MainThreadInvoker::invokeOnMainThread(const std::function<void()> task) {
  dispatch_block_t block = [task]() {
    task();
  };
  if ([NSThread isMainThread]) {
      block();
  } else {
      dispatch_async(dispatch_get_main_queue(), block);
  }
}

#endif // __cplusplus
