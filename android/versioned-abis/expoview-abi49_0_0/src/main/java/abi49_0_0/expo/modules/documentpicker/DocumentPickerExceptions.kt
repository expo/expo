package abi49_0_0.expo.modules.documentpicker

import abi49_0_0.expo.modules.kotlin.exception.CodedException

class PickingInProgressException :
  CodedException("Different document picking in progress. Await other document picking first.")

class FailedToCopyToCacheException :
  CodedException("Failed to copy to cache directory.")

class FailedToReadDocumentException :
  CodedException("Failed to read the selected document.")
