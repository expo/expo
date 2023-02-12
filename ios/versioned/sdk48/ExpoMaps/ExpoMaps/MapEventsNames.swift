import Foundation

enum MapEventsNames: String {
  case ON_CAMERA_MOVE_STARTED_EVENT = "onCameraMoveStarted"
  case ON_CAMERA_MOVE_ENDED_EVENT = "onCameraMoveEnded"
  case ON_MARKER_CLICK_EVENT = "onMarkerClick"
  case ON_MARKER_DRAG_STARTED_EVENT = "onMarkerDragStarted"
  case ON_MARKER_DRAG_ENDED_EVENT = "onMarkerDragEnded"
}

func createCameraEventContent(latitude: Double, longitude: Double) -> [String: Any?] {
  return ["latitude": latitude, "longitude": longitude]
}

func createMarkerClickEventContent(id: String) -> [String: Any?] {
  return ["id": id]
}

func createMarkerDragStartedEventContent(id: String) -> [String: Any?] {
  return ["id": id]
}

func createMarkerDragEndedEventContent(id: String, latitude: Double, longitude: Double) -> [String: Any?] {
  return ["id": id, "latitude": latitude, "longitude": longitude]
}
