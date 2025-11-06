package expo.modules.contacts.next.domain.wrappers

@JvmInline
value class ContactDate(val value: String) {
  init {
    require(value.matches(Regex("""(--\d{2}-\d{2})|(\d{4}-\d{2}-\d{2})"""))) {
      "Invalid date format. Expected '--MM-DD' or 'YYYY-MM-DD', but was '$value'"
    }
  }

  val year: String?
    get() = if (value.startsWith("--")) {
      null
    } else {
      value.substring(0, 4)
    }

  val month: String
    get() = if (value.startsWith("--")) {
      value.substring(2, 4)
    } else {
      value.substring(5, 7)
    }

  val day: String
    get() = if (value.startsWith("--")) {
      value.substring(5, 7)
    } else {
      value.substring(8, 10)
    }
}
