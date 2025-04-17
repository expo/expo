// Copyright 2023-present 650 Industries. All rights reserved.

#ifndef MainThreadInvoker_h
#define MainThreadInvoker_h

#include <functional>

class MainThreadInvoker {
public:
  static void invokeOnMainThread(const std::function<void()> task);
};

#endif
