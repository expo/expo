/**
 Allows declaring non-optional `Int` field without assigning an initial value.
 */
public extension Field where Type == Int {
  convenience init(wrappedValue: Type = 0) {
    self.init(wrappedValue: wrappedValue, [])
  }

  convenience init(wrappedValue: Type = 0, _ options: FieldOption...) {
    self.init(wrappedValue: wrappedValue, options)
  }
}

/**
 Allows declaring non-optional `Double` field without assigning an initial value.
 */
public extension Field where Type == Double {
  convenience init(wrappedValue: Type = 0.0) {
    self.init(wrappedValue: wrappedValue, [])
  }

  convenience init(wrappedValue: Type = 0.0, _ options: FieldOption...) {
    self.init(wrappedValue: wrappedValue, options)
  }
}

/**
 Allows declaring non-optional `Bool` field without assigning an initial value.
 */
public extension Field where Type == Bool {
  convenience init(wrappedValue: Type = false) {
    self.init(wrappedValue: wrappedValue, [])
  }

  convenience init(wrappedValue: Type = false, _ options: FieldOption...) {
    self.init(wrappedValue: wrappedValue, options)
  }
}

/**
 Allows declaring non-optional `String` field without assigning an initial value.
 */
public extension Field where Type == String {
  convenience init(wrappedValue: Type = "") {
    self.init(wrappedValue: wrappedValue, [])
  }

  convenience init(wrappedValue: Type = "", _ options: FieldOption...) {
    self.init(wrappedValue: wrappedValue, options)
  }
}

/**
 Allows declaring non-optional array field without assigning an initial value.
 */
public extension Field where Type: ExpressibleByArrayLiteral {
  convenience init(wrappedValue: Type = []) {
    self.init(wrappedValue: wrappedValue, [])
  }

  convenience init(wrappedValue: Type = [], _ options: FieldOption...) {
    self.init(wrappedValue: wrappedValue, options)
  }
}

/**
 Allows declaring non-optional dictionary field without assigning an initial value.
 */
public extension Field where Type: ExpressibleByDictionaryLiteral {
  convenience init(wrappedValue: Type = [:]) {
    self.init(wrappedValue: wrappedValue, [])
  }

  convenience init(wrappedValue: Type = [:], _ options: FieldOption...) {
    self.init(wrappedValue: wrappedValue, options)
  }
}

/**
 Allows declaring non-optional record field without assigning an initial value.
 */
public extension Field where Type: Record {
  convenience init(wrappedValue: Type = Type.init()) {
    self.init(wrappedValue: wrappedValue, [])
  }

  convenience init(wrappedValue: Type = Type.init(), _ options: FieldOption...) {
    self.init(wrappedValue: wrappedValue, options)
  }
}
