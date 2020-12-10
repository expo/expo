// Copyright (c) Facebook, Inc. and its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#pragma once

namespace folly {
class exception_wrapper;
}

namespace rsocket {

// The application should implement this interface to get called-back
// on network events.
class RSocketConnectionEvents {
 public:
  virtual ~RSocketConnectionEvents() = default;

  // This method gets called when the underlying transport is connected to the
  // remote side.  This does not necessarily mean that the RSocket connection
  // will be successful.  As an example, the transport might get reconnected
  // for an existing RSocketStateMachine.  But resumption at the RSocket layer
  // might not succeed.
  virtual void onConnected() {}

  // This gets called when the underlying transport has disconnected.  This also
  // means the RSocket connection is disconnected.
  virtual void onDisconnected(const folly::exception_wrapper&) {}

  // This gets called when the RSocketStateMachine is closed.  You cant use this
  // RSocketStateMachine anymore.
  virtual void onClosed(const folly::exception_wrapper&) {}

  // This gets called when no more frames can be sent over the RSocket streams.
  // This typically happens immediately after onDisconnected(). The streams can
  // be resumed after onStreamsResumed() event.
  virtual void onStreamsPaused() {}

  // This gets called when the underlying transport has been successfully
  // connected AND the connection can be resumed at the RSocket layer.  This
  // typically gets called after onConnected()
  virtual void onStreamsResumed() {}
};
} // namespace rsocket
