package expo.modules.contacts

import expo.modules.kotlin.exception.CodedException

class ContactPickingInProgressException :
  CodedException("Different contact picking in progress. Await other contact picking first.")

class ContactManipulationInProgressException :
  CodedException("Different contact manipulation in progress. Await other contact manipulation first.")