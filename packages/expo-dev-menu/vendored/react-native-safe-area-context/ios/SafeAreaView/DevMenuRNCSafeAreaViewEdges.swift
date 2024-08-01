import ExpoModulesCore

enum SafeAreaViewEdges: Int, Enumerable {
  case top = 0b1000
  case right = 0b0100
  case bottom = 0b0010
  case left  = 0b0001
  case all = 0b1111
}
