package expo.modules.contacts

import expo.modules.kotlin.exception.CodedException

class ContactPickingInProgressException :
  CodedException("Different contact picking in progress. Await other contact picking first.")