package expo.modules.documentpicker

import expo.modules.kotlin.exception.CodedException

class PickingInProgressException :
  CodedException("Different document picking in progress. Await other document picking first.")

class FailedToReadDocumentException :
  CodedException("Failed to read the selected document.")

class DocumentPickerOptionsEmptyListException :
  CodedException("The 'type' argument must be a non-empty array.")
