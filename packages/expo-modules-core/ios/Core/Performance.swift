// Copyright 2025-present 650 Industries. All rights reserved.

/**
 The `Performance` interface provides access to performance-related information.
 Performance is specific to each app context that you can access via `appContext.performance`.
 */
public final class Performance {
  /**
   Marker object that helps measure the time that has passed from a specific start point to a specific end point.
   */
  public struct Marker {
    /**
     Enum with predefined marker tags that are commonly used by Expo Modules core.
     Use `.custom(String)` for your own non-predefined types of markers.
     */
    public enum Tag: Hashable {
      case modulesRegistration
      case runtimePreparation
      case loadingModulesProvider
      case custom(_ name: String)
    }

    public let tag: Tag
    public let startTime: TimeInterval = CACurrentMediaTime()
    public private(set) var endTime: TimeInterval? = nil

    /**
     Time that has passed from the starting point to when it stopped,
     or until now if the marker has not been stopped yet.
     */
    var elapsedTime: TimeInterval {
      return (endTime ?? CACurrentMediaTime()) - startTime
    }

    /**
     Initializes a marker with given tag. The starting point is automatically set to now.
     */
    public init(_ tag: Tag) {
      self.tag = tag
    }

    /**
     Sets the marker's end time and returns itself.
     */
    mutating public func stopped() -> Self {
      endTime = CACurrentMediaTime()
      #if DEBUG
      print("⏱️ Marker \"\(tag)\" has stopped in \(String(format: "%.9f", elapsedTime)) seconds")
      #endif
      return self
    }
  }

  /**
   Key-value container for markers.
   */
  private var markers = [Marker.Tag: Marker]()

  /**
   Measures the execution time of given asynchronous closure and rereturns its result.
   */
  public func measuring<Result>(_ tag: Marker.Tag, _ action: () async throws -> Result) async rethrows -> Result {
    var marker = Marker(tag)
    let result = try await action()
    markers[tag] = marker.stopped()
    return result
  }

  /**
   Measures the execution time of given synchronous closure and rereturns its result.
   */
  public func measuring<Result>(_ tag: Marker.Tag, _ action: () throws -> Result) rethrows -> Result {
    var marker = Marker(tag)
    let result = try action()
    markers[tag] = marker.stopped()
    return result
  }

  /**
   Starts a marker with given tag.
   */
  public func start(_ tag: Marker.Tag) {
    markers[tag] = Marker(tag)
  }

  /**
   Sets the end point of the marker with given tag.
   */
  public func stop(_ tag: Marker.Tag) {
    markers[tag] = markers[tag]?.stopped()
  }

  /**
   Returns the elapsed time in seconds that has passed between marker's start and end points.
   */
  public func getTime(_ tag: Marker.Tag) -> TimeInterval? {
    return markers[tag]?.elapsedTime
  }
}
