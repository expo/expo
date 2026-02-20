package expo.modules.contacts.next.mappers

import expo.modules.contacts.next.records.contact.PatchContactRecord

fun PatchContactRecord.isChangingStructuredName() =
  !givenName.isUndefined ||
    !middleName.isUndefined ||
    !familyName.isUndefined ||
    !prefix.isUndefined ||
    !suffix.isUndefined ||
    !phoneticGivenName.isUndefined ||
    !phoneticMiddleName.isUndefined ||
    !phoneticFamilyName.isUndefined

fun PatchContactRecord.isChangingOrganization() =
  !company.isUndefined ||
    !department.isUndefined ||
    !jobTitle.isUndefined ||
    !phoneticCompanyName.isUndefined
