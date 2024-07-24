import ExpoModulesCore

internal class PrinterPickerException: GenericException<String?> {
  override var reason: String {
    "There was a problem with the printer picker: '\(param ?? "unknown error")'"
  }
}

internal class ViewControllerNotFoundException: Exception {
  override var reason: String {
    "Could not find the current view controller"
  }
}

internal class PickerCanceledException: Exception {
  override var reason: String {
    "Printer picker has been cancelled"
  }
}

internal class PdfNotRenderedException: GenericException<String?> {
  override var reason: String {
    "Error occurred while printing to PDF: '\(param ?? "unknown error")'"
  }
}

internal class PdfSavingException: Exception {
  override var reason: String {
    "Error occurred while saving the PDF"
  }
}

internal class UnsupportedFormatException: GenericException<String?> {
  override var reason: String {
    "Given format '\(param ?? "unknown")' is not supported"
  }
}

internal class FileOpeningException: Exception {
  override var reason: String {
    "Error occurred while opening the file"
  }
}

internal class InvalidUrlException: Exception {
  override var reason: String {
    "The specified url is not valid for printing"
  }
}

internal class NoPrintDataException: Exception {
  override var reason: String {
    "No data to print. You must specify `uri` or `html` option"
  }
}

internal class PrintingJobFailedException: GenericException<String?> {
  override var reason: String {
    "Printing job encountered an error: '\(param ?? "unknown error")'"
  }
}

internal class PrintIncompleteException: Exception {
  override var reason: String {
    "Printing did not complete"
  }
}
