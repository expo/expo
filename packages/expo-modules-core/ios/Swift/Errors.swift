
class Errors {
  struct ArrayTooLong: Error {
    let size: Int
    let limit: Int
  }

  struct IncompatibleArgumentType<ArgumentType, DesiredType>: Error, CustomStringConvertible {
    let argument: ArgumentType
    let atIndex: Int
    let desiredType: DesiredType.Type

    var description: String {
      return "Type '\(type(of: argument))' of argument at index '\(atIndex)' is not compatible with expected type '\(desiredType.self)'."
    }
  }
}
