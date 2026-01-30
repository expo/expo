/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_PROFILERDOMAINAGENT_H
#define HERMES_CDP_PROFILERDOMAINAGENT_H

#include <hermes/cdp/MessageConverters.h>
#include <hermes/hermes.h>

#include "DomainAgent.h"

namespace facebook {
namespace hermes {
namespace cdp {

/// Handler for the "Profiler" domain of CDP. All methods expect to be invoked
/// with exclusive access to the runtime.
class ProfilerDomainAgent : public DomainAgent {
 public:
  ProfilerDomainAgent(
      int32_t executionContextID,
      HermesRuntime &runtime,
      SynchronizedOutboundCallback messageCallback,
      std::shared_ptr<RemoteObjectsTable> objTable);
  ~ProfilerDomainAgent() = default;

  void start(const m::profiler::StartRequest &req);
  void stop(const m::profiler::StopRequest &req);

 private:
  HermesRuntime &runtime_;
};

} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_PROFILERDOMAINAGENT_H
