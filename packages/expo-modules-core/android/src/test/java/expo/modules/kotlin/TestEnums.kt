package expo.modules.kotlin

import expo.modules.kotlin.types.Enumerable

enum class EnumWithoutParameter : Enumerable {
  VALUE1,
  VALUE2,
  VALUE3
}

enum class EnumWithInt(val value: Int) : Enumerable {
  VALUE1(1),
  VALUE2(2),
  VALUE3(3)
}

enum class EnumWithString(val value: String) : Enumerable {
  VALUE1("value1"),
  VALUE2("value2"),
  VALUE3("value3")
}
