/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0jsireact/ABI47_0_0JSINativeModules.h"
#include <ABI47_0_0Reactperflogger/ABI47_0_0BridgeNativeModulePerfLogger.h>

#include <glog/logging.h>

#include <ABI47_0_0cxxreact/ABI47_0_0ReactMarker.h>

#include <ABI47_0_0jsi/ABI47_0_0JSIDynamic.h>

#include <string>

using namespace ABI47_0_0facebook::jsi;

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

JSINativeModules::JSINativeModules(
    std::shared_ptr<ModuleRegistry> moduleRegistry)
    : m_moduleRegistry(std::move(moduleRegistry)) {}

Value JSINativeModules::getModule(Runtime &rt, const PropNameID &name) {
  if (!m_moduleRegistry) {
    return nullptr;
  }

  std::string moduleName = name.utf8(rt);

  BridgeNativeModulePerfLogger::moduleJSRequireBeginningStart(
      moduleName.c_str());

  const auto it = m_objects.find(moduleName);
  if (it != m_objects.end()) {
    BridgeNativeModulePerfLogger::moduleJSRequireBeginningCacheHit(
        moduleName.c_str());
    BridgeNativeModulePerfLogger::moduleJSRequireBeginningEnd(
        moduleName.c_str());
    return Value(rt, it->second);
  }

  auto module = createModule(rt, moduleName);
  if (!module.hasValue()) {
    BridgeNativeModulePerfLogger::moduleJSRequireEndingFail(moduleName.c_str());
    // Allow lookup to continue in the objects own properties, which allows for
    // overrides of NativeModules
    return nullptr;
  }

  auto result =
      m_objects.emplace(std::move(moduleName), std::move(*module)).first;

  Value ret = Value(rt, result->second);
  BridgeNativeModulePerfLogger::moduleJSRequireEndingEnd(moduleName.c_str());
  return ret;
}

void JSINativeModules::reset() {
  m_genNativeModuleJS = folly::none;
  m_objects.clear();
}

folly::Optional<Object> JSINativeModules::createModule(
    Runtime &rt,
    const std::string &name) {
  bool hasLogger(ABI47_0_0ReactMarker::logTaggedMarker);
  if (hasLogger) {
    ABI47_0_0ReactMarker::logTaggedMarker(
        ABI47_0_0ReactMarker::NATIVE_MODULE_SETUP_START, name.c_str());
  }

  if (!m_genNativeModuleJS) {
    m_genNativeModuleJS =
        rt.global().getPropertyAsFunction(rt, "__fbGenNativeModule");
  }

  auto result = m_moduleRegistry->getConfig(name);
  if (!result.hasValue()) {
    return folly::none;
  }

  Value moduleInfo = m_genNativeModuleJS->call(
      rt,
      valueFromDynamic(rt, result->config),
      static_cast<double>(result->index));
  CHECK(!moduleInfo.isNull()) << "Module returned from genNativeModule is null";
  CHECK(moduleInfo.isObject())
      << "Module returned from genNativeModule isn't an Object";

  folly::Optional<Object> module(
      moduleInfo.asObject(rt).getPropertyAsObject(rt, "module"));

  if (hasLogger) {
    ABI47_0_0ReactMarker::logTaggedMarker(
        ABI47_0_0ReactMarker::NATIVE_MODULE_SETUP_STOP, name.c_str());
  }

  return module;
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
