package expo.modules.contacts.next.records

import expo.modules.contacts.next.records.contact.GetContactDetailsRecord
import expo.modules.contacts.next.records.fields.ContactField
import expo.modules.kotlin.records.formatters.FormattedRecord
import expo.modules.kotlin.records.formatters.formatter

class SkipFormatter(private val fields: Set<ContactField>?) {
  private val formatter = formatter {
    if (fields == null) {
      return@formatter
    }
    property(GetContactDetailsRecord::givenName).skip { !fields.contains(ContactField.GIVEN_NAME) }
    property(GetContactDetailsRecord::middleName).skip { !fields.contains(ContactField.MIDDLE_NAME) }
    property(GetContactDetailsRecord::familyName).skip { !fields.contains(ContactField.FAMILY_NAME) }
    property(GetContactDetailsRecord::prefix).skip { !fields.contains(ContactField.PREFIX) }
    property(GetContactDetailsRecord::suffix).skip { !fields.contains(ContactField.SUFFIX) }
    property(GetContactDetailsRecord::phoneticGivenName).skip { !fields.contains(ContactField.PHONETIC_GIVEN_NAME) }
    property(GetContactDetailsRecord::phoneticMiddleName).skip { !fields.contains(ContactField.PHONETIC_MIDDLE_NAME) }
    property(GetContactDetailsRecord::phoneticFamilyName).skip { !fields.contains(ContactField.PHONETIC_FAMILY_NAME) }
    property(GetContactDetailsRecord::company).skip { !fields.contains(ContactField.COMPANY) }
    property(GetContactDetailsRecord::department).skip { !fields.contains(ContactField.DEPARTMENT) }
    property(GetContactDetailsRecord::jobTitle).skip { !fields.contains(ContactField.JOB_TITLE) }
    property(GetContactDetailsRecord::emails).skip { !fields.contains(ContactField.EMAILS) }
    property(GetContactDetailsRecord::phones).skip { !fields.contains(ContactField.PHONES) }
    property(GetContactDetailsRecord::addresses).skip { !fields.contains(ContactField.ADDRESSES) }
    property(GetContactDetailsRecord::dates).skip { !fields.contains(ContactField.DATES) }
    property(GetContactDetailsRecord::relationships).skip { !fields.contains(ContactField.RELATIONSHIPS) }
    property(GetContactDetailsRecord::urlAddresses).skip { !fields.contains(ContactField.URL_ADDRESSES) }
    property(GetContactDetailsRecord::extraNames).skip { !fields.contains(ContactField.EXTRA_NAMES) }
  }

  fun format(getContactDetailsRecord: GetContactDetailsRecord): FormattedRecord<GetContactDetailsRecord> =
    formatter.format(getContactDetailsRecord)
}
