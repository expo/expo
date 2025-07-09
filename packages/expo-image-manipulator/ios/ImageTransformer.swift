// Copyright 2024-present 650 Industries. All rights reserved.

internal protocol ImageTransformer {
  func transform(image: UIImage) async throws -> UIImage
}
