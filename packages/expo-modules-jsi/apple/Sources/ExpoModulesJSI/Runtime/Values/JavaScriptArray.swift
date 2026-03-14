internal import jsi
internal import ExpoModulesJSI_Cxx

/**
 A Swift representation of a JavaScript array. `JavaScriptArray` provides a bridge between JavaScript arrays
 and Swift, allowing you to access and manipulate JavaScript array elements from Swift code. It maintains a reference
 to the underlying JavaScript array and provides Swift-friendly APIs for common array operations.
 */
public struct JavaScriptArray: JavaScriptType, ~Copyable {
  internal weak var runtime: JavaScriptRuntime?
  internal let pointee: facebook.jsi.Array

  /**
   Creates a new JavaScript array with the specified length.

   This is the primary initializer for creating empty or pre-sized JavaScript arrays.
   If no length is provided, an empty array is created. When a length is specified,
   the array is created with that many elements, each initialized to `undefined`.

   - Parameters:
     - runtime: The JavaScript runtime in which to create the array
     - length: The initial length of the array. Defaults to 0 (empty array).

   ## Examples

   ```swift
   // Create an empty array
   let empty = JavaScriptArray(runtime)

   // Create an array with specific length (all elements are undefined)
   let sized = JavaScriptArray(runtime, length: 10)
   print(sized.length)  // 10
   print(sized[0])      // undefined
   ```

   - Note: This initializer creates a new JavaScript array object in the runtime's heap.
     The array's length can be modified later using the `length` property.
   - SeeAlso: `init(_:items:)` for creating arrays with initial values
   */
  public init(_ runtime: JavaScriptRuntime, length: Int = 0) {
    self.init(runtime, facebook.jsi.Array(runtime.pointee, length))
  }

  /**
   Creates a Swift wrapper around an existing JSI array object.

   This internal initializer is used to wrap a C++ JSI `Array` object with a Swift
   `JavaScriptArray` interface. It takes ownership of the provided JSI array using
   Swift's consuming parameter ownership, ensuring proper move semantics.

   - Parameters:
     - runtime: The JavaScript runtime that owns the array
     - pointee: The underlying JSI `Array` object to wrap (consumed)

   - Note: This initializer is internal and used by the library's implementation to
     bridge between the C++ JSI layer and Swift. It should not be called directly
     by library consumers.
   - Note: The `pointee` parameter uses consuming ownership, meaning the JSI array
     object is moved into this structure and the caller's copy is invalidated.
   */
  internal init(_ runtime: JavaScriptRuntime, _ pointee: consuming facebook.jsi.Array) {
    self.runtime = runtime
    self.pointee = pointee
  }

  /**
   Creates a new JavaScript array initialized with the provided array of values.

   This initializer allows you to create a JavaScript array from a Swift array of
   `JavaScriptValue` elements. This is particularly useful when you already have
   a collection of values and want to avoid the syntactic overhead of spreading them
   as variadic arguments.

   - Parameters:
     - runtime: The JavaScript runtime in which to create the array
     - items: A Swift array of `JavaScriptValue` elements to populate the array with

   ## Examples

   ```swift
   // Create from an existing array
   let values = [JavaScriptValue.number(1), .number(2), .number(3)]
   let array = JavaScriptArray(runtime, items: values)

   // Create from a mapped collection
   let numbers = [1, 2, 3, 4, 5]
   let jsValues = numbers.map { JavaScriptValue.number(Double($0)) }
   let array = JavaScriptArray(runtime, items: jsValues)
   ```

   - Note: Due to limitations in Swift/C++ interop with `std::initializer_list`, this
     implementation creates an empty array first and then populates it element by element,
     rather than using JSI's `createWithElements` method directly.
   - SeeAlso: `init(_:items:)` for the variadic argument version
   */
  public init(_ runtime: JavaScriptRuntime, items: [JavaScriptValue]) {
    self.init(runtime, length: items.count)

    for (i, item) in items.enumerated() {
      self[i] = item
    }
  }

  /**
   Creates a new JavaScript array initialized with the provided values.

   This convenience initializer allows you to create a JavaScript array from a variable
   number of `JavaScriptValue` arguments. The array is created with the appropriate length
   and populated with the provided values in order.

   - Parameters:
     - runtime: The JavaScript runtime in which to create the array
     - items: A variadic list of `JavaScriptValue` elements to populate the array with

   ## Examples

   ```swift
   // Create an empty array
   let empty = JavaScriptArray(runtime, items: )

   // Create an array with values
   let numbers = JavaScriptArray(runtime, items: .number(1), .number(2), .number(3))

   // Mix different value types
   let mixed = JavaScriptArray(runtime,
     items: .string("hello"), .number(42), .bool(true))
   ```

   - Note: This variadic version internally creates a Swift array and delegates to the
     array-based initializer. If you already have an array of values, consider using
     `init(_:items:)` directly for cleaner syntax.
   - SeeAlso: `init(_:items:)` for the array version
   */
  public init(_ runtime: JavaScriptRuntime, items: JavaScriptValue...) {
    self.init(runtime, items: items)
  }

  /**
   Creates a new JavaScript array from variadic arguments of any types conforming to `JavaScriptRepresentable`.

   This generic initializer uses Swift's parameter pack feature to accept a variable number of
   arguments of potentially different types, as long as each type conforms to `JavaScriptRepresentable`.
   This provides a type-safe and ergonomic way to create JavaScript arrays from Swift values without
   needing to manually convert them to `JavaScriptValue` first.

   - Parameters:
     - runtime: The JavaScript runtime in which to create the array
     - items: A variadic parameter pack of values conforming to `JavaScriptRepresentable`

   ## Examples

   ```swift
   // Mix different Swift types directly
   let array = JavaScriptArray(runtime, items: 42, "hello", true, 3.14)

   // All same type works too
   let numbers = JavaScriptArray(runtime, items: 1, 2, 3, 4, 5)

   // Use with custom types that conform to JavaScriptRepresentable
   struct Person: JavaScriptRepresentable {
     let name: String
     let age: Int
   }
   let people = [Person(name: "Alice", age: 30), Person(name: "Bob", age: 25)]
   let array = JavaScriptArray(runtime, items: people[0], people[1])
   ```

   - Note: This initializer automatically converts each item to a `JavaScriptValue` using
     its `toJavaScriptValue(in:)` method, providing compile-time type safety.
   - Note: Unlike the `JavaScriptValue` variadic initializer, this version accepts heterogeneous
     types directly without requiring explicit `JavaScriptValue` wrapping.
   - SeeAlso: `init(_:items:)` for the `JavaScriptValue` array version
   */
  public init<each T: JavaScriptRepresentable>(_ runtime: JavaScriptRuntime, items: repeat each T) {
    var length: Int = 0
    for _ in repeat each items {
      length += 1
    }

    self.init(runtime, length: length)
    var index: Int = 0

    for item in repeat each items {
      self[index] = item.toJavaScriptValue(in: runtime)
      index += 1
    }
  }

  /**
   The length of the JavaScript array, equivalent to the `length` property in JavaScript.

   This property provides direct access to the array's length, which can be both read and
   modified. Changing the length affects the array size, matching JavaScript's behavior.

   ## Getting the Length

   Returns the current number of elements in the array:

   ```swift
   let array = try runtime.eval("[1, 2, 3]").getArray()
   print(array.length) // 3
   ```

   ## Setting the Length

   Modifying the length changes the array size:
   - **Increasing** the length adds `undefined` elements to fill the gap
   - **Decreasing** the length truncates the array, removing elements

   ```swift
   let array = try runtime.eval("[1, 2, 3, 4, 5]").getArray()

   // Truncate the array
   array.length = 3
   // Array is now [1, 2, 3]

   // Expand the array
   array.length = 5
   // Array is now [1, 2, 3, undefined, undefined]
   ```

   - Note: This property directly modifies the JavaScript array's `length` property,
     providing the same semantics as `array.length = newValue` in JavaScript.
   */
  public var length: Int {
    get {
      guard let runtime else {
        FatalError.runtimeLost()
      }
      return pointee.size(runtime.pointee)
    }
    nonmutating set(newLength) {
      guard let runtime else {
        FatalError.runtimeLost()
      }
      expo.setArrayLength(runtime.pointee, pointee, newLength)
    }
  }

  /**
   Retrieves the value at the specified index in the array.

   - Parameter index: The zero-based index of the element to retrieve
   - Returns: The `JavaScriptValue` at the specified index
   - Throws: `JavaScriptArray.Errors.indexOutOfRange` if the index is negative or
     greater than or equal to the array's length
   */
  public func getValue(at index: Int) throws -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let length = self.length
    guard (0..<length).contains(index) else {
      throw Errors.indexOutOfRange(index: index, length: length)
    }
    return JavaScriptValue(runtime, pointee.getValueAtIndex(runtime.pointee, index))
  }

  /**
   Sets the element at the specified index.

   - Parameters:
     - value: The value to set, conforming to `JavaScriptRepresentable`
     - index: The zero-based index where the value should be set
   - Throws: `JavaScriptArray.Errors.indexOutOfRange` if the index is out of bounds
   */
  public func set<T: JavaScriptRepresentable & ~Copyable>(value: borrowing T, at index: Int) throws {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let length = self.length
    guard (0..<length).contains(index) else {
      throw Errors.indexOutOfRange(index: index, length: length)
    }
    let jsiValue = value.toJavaScriptValue(in: runtime).toJSIValue(in: runtime.pointee)
    expo.setValueAtIndex(runtime.pointee, pointee, index, jsiValue)
  }

  /**
   Accesses array elements by numeric index with safe, non-throwing behavior.

   This subscript provides a convenient way to read and write array elements without
   explicit error handling. It mimics JavaScript's array behavior by automatically
   handling out-of-bounds access and dynamic resizing.

   - Parameter index: The zero-based index of the element to access or modify
   - Returns: The `JavaScriptValue` at the specified index, or `undefined` if the index
     is out of range

   ## Getting Values

   Returns `undefined` if the index is out of bounds (no error thrown):

   ```swift
   let array = try runtime.eval("[1, 2, 3]").getArray()
   let value = array[1]           // JavaScriptValue(2)
   let outOfRange = array[10]     // JavaScriptValue.undefined()
   ```

   ## Setting Values

   Automatically expands the array if the index is beyond the current length:

   ```swift
   let array = try runtime.eval("[1, 2, 3]").getArray()
   array[1] = .number(99)         // Updates existing element
   array[10] = .string("hello")   // Expands array to size 11
   ```

   - Note: This subscript never throws. For strict bounds checking with errors,
     use `getValue(at:)` and `set(value:at:)` instead.
   - Note: When setting an element beyond the current length, intermediate elements
     are filled with `undefined`, matching JavaScript's behavior.
   */
  public subscript(index: Int) -> JavaScriptValue {
    get {
      return (try? self.getValue(at: index)) ?? .undefined()
    }
    nonmutating set {
      guard let runtime else {
        FatalError.runtimeLost()
      }
      if index >= length {
        self.length = index + 1
      }
      expo.setValueAtIndex(runtime.pointee, pointee, index, newValue.pointee)
    }
  }

  /**
   Type-safe subscript for accessing and modifying array elements with automatic conversion.

   This subscript provides a convenient way to work with JavaScript array elements using
   Swift types that conform to `JavaScriptRepresentable`. It automatically converts between
   JavaScript values and Swift types.

   - Parameter index: The zero-based index of the element to access or modify
   - Returns: An optional value of type `T` if the element exists and can be converted,
     or `nil` if the index is out of range or conversion fails

   ## Getting Values

   When reading, returns `nil` if:
   - The index is out of range
   - The JavaScript value cannot be converted to type `T`

   ```swift
   let array = try runtime.eval("[1, 2, 3]").getArray()
   let value: Int? = array[0]  // Returns 1
   let outOfRange: Int? = array[10]  // Returns nil
   ```

   ## Setting Values

   When writing:
   - Automatically resizes the array if the index is beyond the current length (JavaScript behavior)
   - Setting `nil` sets the element to `undefined`
   - Accepts any value conforming to `JavaScriptRepresentable`

   ```swift
   array[0] = 42              // Sets element to number
   array[5] = "hello"         // Resizes array and sets element
   array[1] = nil             // Sets element to undefined
   ```

   - Note: Unlike `getValue(at:)` and `set(value:at:)`, this subscript mimics JavaScript's
     dynamic array behavior by automatically expanding the array when setting elements beyond
     the current length.
   */
  public subscript<T: JavaScriptRepresentable & ~Copyable>(index: Int) -> T? {
    get {
      return try? T.fromJavaScriptValue(self.getValue(at: index))
    }
    nonmutating set(newValue) {
      guard let runtime else {
        FatalError.runtimeLost()
      }
      if index >= length {
        self.length = index + 1
      }
      let jsiValue = if let newValue {
        newValue.toJavaScriptValue(in: runtime).toJSIValue(in: runtime.pointee)
      } else {
        facebook.jsi.Value.undefined()
      }
      expo.setValueAtIndex(runtime.pointee, pointee, index, jsiValue)
    }
  }

  /**
   Accesses properties of the array using string keys.

   Since JavaScript arrays are also objects, they can have named properties in addition
   to numeric indices. This subscript allows you to access and modify these properties.

   - Parameter key: The property name to access or modify
   - Returns: The value of the property as a `JavaScriptValue`

   ## Examples

   ```swift
   let array = try runtime.eval("[1, 2, 3]").getArray()

   // Access built-in properties
   let length = array["length"]  // JavaScriptValue(3)

   // Set custom properties
   array["customProperty"] = .string("custom value")

   // Access custom properties
   let custom = array["customProperty"]  // JavaScriptValue("custom value")
   ```

   - Note: This subscript accesses object properties, not array elements. To access
     array elements by index, use the numeric subscript `array[0]` instead of `array["0"]`.
   */
  public subscript(key: String) -> JavaScriptValue {
    get {
      guard let runtime else {
        FatalError.runtimeLost()
      }
      let jsiValue = expo.getProperty(runtime.pointee, pointee, .forUtf8(runtime.pointee, key, key.count))
      return JavaScriptValue(runtime, jsiValue)
    }
    nonmutating set(newValue) {
      guard let runtime else {
        FatalError.runtimeLost()
      }
      let jsiValue = newValue.toJSIValue(in: runtime.pointee)
      expo.setProperty(runtime.pointee, pointee, key, jsiValue)
    }
  }

  /**
   Transforms each element in the JavaScript array using the provided closure. This method creates a new Swift array
   by calling the transform closure on each element of the JavaScript array.
   The closure receives a `JavaScriptValue` for each element and returns a transformed value.

   - Parameter transform: A closure that accepts a `JavaScriptValue` representing an element
     from the array and returns a transformed value. The closure can throw an error, which
     will be propagated to the caller.
   - Returns: A Swift array containing the transformed elements in the same order as
     the original JavaScript array.
   - Throws: Any error thrown by the `transform` closure.
   - Note: This method uses Swift's standard `map` semantics and follows the `rethrows`
     pattern, meaning it only throws if the transform closure throws.
   */
  public func map<T>(_ transform: (_ value: JavaScriptValue) throws -> T) rethrows -> [T] {
    return try (0..<length).map { index in
      let value = try self.getValue(at: index)
      return try transform(value)
    }
  }

  /**
   Converts the JavaScript array to a `JavaScriptValue`.

   - Returns: A `JavaScriptValue` representing this array
   - Note: The returned value maintains a reference to the same underlying JavaScript
     array, so modifications to the array in JavaScript will be reflected in the value.
   - SeeAlso: `JavaScriptValue.getArray()` for the inverse operation
   */
  public func asValue() -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtime, expo.valueFromArray(runtime.pointee, pointee))
  }

  /**
   Converts the array to a `JavaScriptObject`.

   Since JavaScript arrays are also objects, this method allows you to access the array
   as a generic object to use object-specific APIs like property enumeration or prototype
   manipulation.

   - Returns: A `JavaScriptObject` representing the same underlying array

   ```swift
   let array = try runtime.eval("[1, 2, 3]").getArray()
   let object = array.toObject()

   // Access array properties as an object
   let length = object.getProperty("length")  // JavaScriptValue(3)
   ```

   - Note: The returned object maintains a reference to the same underlying JavaScript
     array, so modifications through either the array or object interface will affect
     the same data.
   - SeeAlso: `asValue()` for converting to a `JavaScriptValue`
   */
  public func toObject() -> JavaScriptObject {
    return asValue().getObject()
  }

  /**
   Errors that can occur when working with JavaScript arrays.
   */
  public enum Errors: Error, Equatable, CustomStringConvertible {
    /**
     The specified index is out of the array's valid range.

     - Parameters:
       - index: The invalid index that was accessed
       - length: The actual length of the array
     */
    case indexOutOfRange(index: Int, length: Int)

    public var description: String {
      switch self {
      case .indexOutOfRange(let index, let length):
        return "Index \(index) is out of range for array with length \(length). Valid range is 0..<\(length)."
      }
    }
  }
}
