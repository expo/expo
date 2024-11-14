// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 A context of the image manipulation.
 */
public final class ImageManipulatorContext: SharedObject {
  internal typealias Loader = () async throws -> UIImage

  /**
   The last task added to the rendering pipeline.
   */
  private var currentTask: Task<UIImage, Error>

  /**
   A function that was used to load the original image.
   Can be used to reset context's state to the original image.
   */
  private let loader: Loader

  /**
   Initializes a manipulation context with the given loader that returns the original image.
   */
  init(loader: @escaping Loader) {
    self.loader = loader
    currentTask = Task(priority: .background) {
      return try await loader()
    }
    super.init()
  }

  /**
   Adds an image transformer to run on the rendering context in the background.
   */
  @discardableResult
  internal func addTransformer(_ transformer: ImageTransformer) -> Self {
    currentTask = Task(priority: .background) { [currentTask] in
      // The task can be canceled in the meantime (e.g. by resetting to the original image).
      // In this case there is no reason to transform the image any further.
      try Task.checkCancellation()

      let image = try await currentTask.value
      return try await transformer.transform(image: image)
    }
    return self
  }

  /**
   Awaits for the last processing task to finish and returns its result.
   */
  internal func render() async throws -> UIImage {
    return try await currentTask.value
  }

  /**
   Resets the manipulator context to the originally loaded image.
   */
  internal func reset() {
    // Firstly cancel currently running manipulations.
    currentTask.cancel()

    currentTask = Task(priority: .background) {
      return try await loader()
    }
  }
}
