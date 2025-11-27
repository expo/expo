import ExpoModulesCore

protocol ExistingRecord: Record {
  var id: String { get }
}

protocol PatchRecord: Record {
  var id: String { get }
}

protocol NewRecord: Record {}
