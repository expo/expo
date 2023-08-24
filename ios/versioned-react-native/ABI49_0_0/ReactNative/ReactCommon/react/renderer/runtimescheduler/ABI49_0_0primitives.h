/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>
#include <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0Task.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

struct TaskWrapper : public jsi::HostObject {
  TaskWrapper(std::shared_ptr<Task> const &task) : task(task) {}

  std::shared_ptr<Task> task;
};

inline static jsi::Value valueFromTask(
    jsi::Runtime &runtime,
    std::shared_ptr<Task> task) {
  return jsi::Object::createFromHostObject(
      runtime, std::make_shared<TaskWrapper>(task));
}

inline static std::shared_ptr<Task> taskFromValue(
    jsi::Runtime &runtime,
    jsi::Value const &value) {
  if (value.isNull()) {
    return nullptr;
  }

  return value.getObject(runtime).getHostObject<TaskWrapper>(runtime)->task;
}

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
