// Copyright 2015-present 650 Industries. All rights reserved.

/**
 States represent for native response.
 */
internal enum ResponseState: Int {
  case intialized = 0
  case started
  case responseReceived
  case bodyCompleted
  case bodyStreamingStarted
  case bodyStreamingCanceled
  case errorReceived
}
