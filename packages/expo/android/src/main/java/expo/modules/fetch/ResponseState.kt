// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

internal enum class ResponseState(val intValue: Int) {
  INITIALIZED(0),
  STARTED(1),
  RESPONSE_RECEIVED(2),
  BODY_COMPLETED(3),
  BODY_STREAMING_STARTED(4),
  BODY_STREAMING_CANCELED(5),
  ERROR_RECEIVED(6)
}
