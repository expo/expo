/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef HERMES_CDP_HEAPPROFILERDOMAINAGENT_H
#define HERMES_CDP_HEAPPROFILERDOMAINAGENT_H

#include <hermes/hermes.h>

#include "DomainAgent.h"

namespace facebook {
namespace hermes {
namespace cdp {

/// Handler for the "HeapProfiler" domain of CDP. All methods expect to be
/// invoked with exclusive access to the runtime.
class HeapProfilerDomainAgent : public DomainAgent {
 public:
  HeapProfilerDomainAgent(
      int32_t executionContextID,
      HermesRuntime &runtime,
      SynchronizedOutboundCallback messageCallback,
      std::shared_ptr<RemoteObjectsTable> objTable);
  ~HeapProfilerDomainAgent();

  /// Handles HeapProfiler.takeHeapSnapshot request
  void takeHeapSnapshot(const m::heapProfiler::TakeHeapSnapshotRequest &req);

  /// Handle HeapProfiler.getObjectByHeapObjectId
  void getObjectByHeapObjectId(
      const m::heapProfiler::GetObjectByHeapObjectIdRequest &req);

  /// Handle HeapProfiler.getObjectByHeapObjectId
  void getHeapObjectId(const m::heapProfiler::GetHeapObjectIdRequest &req);

  /// Handle HeapProfiler.collectGarbage
  void collectGarbage(const m::heapProfiler::CollectGarbageRequest &req);

  /// Handle HeapProfiler.startTrackingHeapObjects
  void startTrackingHeapObjects(
      const m::heapProfiler::StartTrackingHeapObjectsRequest &req);

  /// Handle HeapProfiler.stopTrackingHeapObjects
  void stopTrackingHeapObjects(
      const m::heapProfiler::StopTrackingHeapObjectsRequest &req);

  /// Handle HeapProfiler.startSampling
  void startSampling(const m::heapProfiler::StartSamplingRequest &req);

  /// Handle HeapProfiler.stopSampling
  void stopSampling(const m::heapProfiler::StopSamplingRequest &req);

 private:
  void sendSnapshot(int reqId, bool reportProgress, bool captureNumericValue);

  HermesRuntime &runtime_;

  /// Flag indicating whether this agent is registered to receive heap object
  /// tracking callbacks.
  bool trackingHeapObjectStackTraces_ = false;

  /// Flag indicating whether this agent is currently running a heap sampling
  /// session.
  bool samplingHeap_ = false;
};

} // namespace cdp
} // namespace hermes
} // namespace facebook

#endif // HERMES_CDP_HEAPPROFILERDOMAINAGENT_H
