// Copyright 2015-present 650 Industries. All rights reserved.

/**
 Native data for ResponseInit.
 */
internal struct NativeResponseInit {
  let headers: [[String]]
  let status: Int
  let statusText: String
  let url: String
}
