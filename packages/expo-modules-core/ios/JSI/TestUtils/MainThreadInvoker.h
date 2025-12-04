// Copyright 2023-present 650 Industries. All rights reserved.

#pragma once

#ifdef __cplusplus

#include <functional>

class MainThreadInvoker {
public:
  static void invokeOnMainThread(const std::function<void()> task);
};

#endif // __cplusplus
