package expo.modules.contacts

import expo.modules.kotlin.exception.CodedException

class ContactPickingInProgressException :
  CodedException("Different contact picking in progress. Await other contact picking first.")

class ContactManipulationInProgressException :
  CodedException("Different contact manipulation in progress. Await other contact manipulation first.")

class MissingPermissionException(permission: String) : CodedException("Missing $permission permission")

class RetrieveIdException : CodedException("Couldn't get the contact id")

class AddContactException : CodedException("Given contact couldn't be added")

class ContactNotFoundException : CodedException("Couldn't find contact")

class ContactUpdateException : CodedException("Given contact couldn't be updated")

class LookupKeyNotFoundException : CodedException("Couldn't find lookup key for contact")
