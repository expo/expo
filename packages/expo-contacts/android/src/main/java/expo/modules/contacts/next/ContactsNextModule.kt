package expo.modules.contacts.next

import expo.modules.contacts.next.intents.ContactIntentDelegate
import expo.modules.contacts.next.domain.ContactRepository
import expo.modules.contacts.next.mappers.ContactRecordDomainMapper
import expo.modules.contacts.next.observers.ContactsObserverDelegate
import expo.modules.contacts.next.records.SkipFormatter
import expo.modules.contacts.next.records.contact.PatchContactRecord
import expo.modules.contacts.next.records.contact.CreateContactRecord
import expo.modules.contacts.next.records.fields.ContactField
import expo.modules.contacts.next.records.fields.DateRecord
import expo.modules.contacts.next.records.fields.EmailRecord
import expo.modules.contacts.next.records.fields.ExtraNameRecord
import expo.modules.contacts.next.records.fields.PhoneRecord
import expo.modules.contacts.next.records.fields.PostalAddressRecord
import expo.modules.contacts.next.records.fields.RelationshipRecord
import expo.modules.contacts.next.records.fields.UrlAddressRecord
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.getValue

class ContactsNextModule : Module() {
  private val context
    get() = appContext.reactContext
      ?: throw Exceptions.ReactContextLost()

  private val contactMapper = ContactRecordDomainMapper()
  private val contactIntentDelegate = ContactIntentDelegate()

  private val contactRepository by lazy {
    ContactRepository(context.contentResolver)
  }

  private val contactFactory by lazy {
    ContactFactory(contactRepository, contactMapper, contactIntentDelegate)
  }

  private val permissionsDelegate by lazy {
    ContactsPermissionsDelegate(appContext)
  }
  private val observerDelegate by lazy {
    ContactsObserverDelegate(appContext, this@ContactsNextModule)
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoContactsNext")

    Class(Contact::class) {
      Constructor { id: String ->
        contactFactory.create(id)
      }

      Property("id") { self: Contact ->
        self.contactId.value
      }

      AsyncFunction("getDetails") Coroutine { self: Contact, fields: Set<ContactField>? ->
        SkipFormatter(fields).format(
          self.getDetails(fields)
        )
      }

      AsyncFunction("delete") Coroutine { self: Contact ->
        self.delete()
      }

      AsyncFunction("patch") Coroutine { self: Contact, patchContactRecord: PatchContactRecord ->
        self.patch(patchContactRecord)
      }

      AsyncFunction("getGivenName") Coroutine { self: Contact ->
        self.givenName.get()
      }

      AsyncFunction("setGivenName") Coroutine { self: Contact, newGivenName: String? ->
        self.givenName.set(newGivenName)
      }

      AsyncFunction("getFamilyName") Coroutine { self: Contact ->
        self.familyName.get()
      }

      AsyncFunction("setFamilyName") Coroutine { self: Contact, newFamilyName: String? ->
        self.familyName.set(newFamilyName)
      }

      AsyncFunction("getMiddleName") Coroutine { self: Contact ->
        self.middleName.get()
      }

      AsyncFunction("setMiddleName") Coroutine { self: Contact, newMiddleName: String? ->
        self.middleName.set(newMiddleName)
      }

      AsyncFunction("getPrefix") Coroutine { self: Contact ->
        self.prefix.get()
      }

      AsyncFunction("setPrefix") Coroutine { self: Contact, newPrefix: String? ->
        self.prefix.set(newPrefix)
      }

      AsyncFunction("getSuffix") Coroutine { self: Contact ->
        self.suffix.get()
      }

      AsyncFunction("setSuffix") Coroutine { self: Contact, newSuffix: String? ->
        self.suffix.set(newSuffix)
      }

      AsyncFunction("getPhoneticGivenName") Coroutine { self: Contact ->
        self.phoneticGivenName.get()
      }

      AsyncFunction("setPhoneticGivenName") Coroutine { self: Contact, newPhoneticGivenName: String? ->
        self.phoneticGivenName.set(newPhoneticGivenName)
      }

      AsyncFunction("getPhoneticMiddleName") Coroutine { self: Contact ->
        self.phoneticMiddleName.get()
      }

      AsyncFunction("setPhoneticMiddleName") Coroutine { self: Contact, newPhoneticMiddleName: String? ->
        self.phoneticMiddleName.set(newPhoneticMiddleName)
      }

      AsyncFunction("getPhoneticFamilyName") Coroutine { self: Contact ->
        self.phoneticFamilyName.get()
      }

      AsyncFunction("setPhoneticFamilyName") Coroutine { self: Contact, newPhoneticFamilyName: String? ->
        self.phoneticFamilyName.set(newPhoneticFamilyName)
      }

      AsyncFunction("getCompany") Coroutine { self: Contact ->
        self.company.get()
      }

      AsyncFunction("setCompany") Coroutine { self: Contact, newCompany: String? ->
        self.company.set(newCompany)
      }

      AsyncFunction("getDepartment") Coroutine { self: Contact ->
        self.department.get()
      }

      AsyncFunction("setDepartment") Coroutine { self: Contact, newDepartment: String? ->
        self.department.set(newDepartment)
      }

      AsyncFunction("getJobTitle") Coroutine { self: Contact ->
        self.jobTitle.get()
      }

      AsyncFunction("setJobTitle") Coroutine { self: Contact, newJobTitle: String? ->
        self.jobTitle.set(newJobTitle)
      }

      AsyncFunction("getPhoneticOrganizationName") Coroutine { self: Contact ->
        self.phoneticOrganizationName.get()
      }

      AsyncFunction("setPhoneticOrganizationName") Coroutine { self: Contact, newPhoneticName: String? ->
        self.phoneticOrganizationName.set(newPhoneticName)
      }

      AsyncFunction("getNote") Coroutine { self: Contact ->
        self.note.get()
      }

      AsyncFunction("setNote") Coroutine { self: Contact, newNote: String? ->
        self.note.set(newNote)
      }

      AsyncFunction("getEmails") Coroutine { self: Contact ->
        self.emails.getAll()
      }

      AsyncFunction("addEmail") Coroutine { self: Contact, emailRecord: EmailRecord.New ->
        self.emails.add(emailRecord)
      }

      AsyncFunction("updateEmail") Coroutine { self: Contact, emailRecord: EmailRecord.Existing ->
        self.emails.update(emailRecord)
      }

      AsyncFunction("deleteEmail") Coroutine { self: Contact, emailRecord: EmailRecord.Existing ->
        self.emails.delete(emailRecord)
      }

      AsyncFunction("getPhones") Coroutine { self: Contact ->
        self.phones.getAll()
      }

      AsyncFunction("addPhone") Coroutine { self: Contact, phoneRecord: PhoneRecord.New ->
        self.phones.add(phoneRecord)
      }

      AsyncFunction("updatePhone") Coroutine { self: Contact, phoneRecord: PhoneRecord.Existing ->
        self.phones.update(phoneRecord)
      }

      AsyncFunction("deletePhone") Coroutine { self: Contact, phoneRecord: PhoneRecord.Existing ->
        self.phones.delete(phoneRecord)
      }

      AsyncFunction("getPostalAddresses") Coroutine { self: Contact ->
        self.postalAddresses.getAll()
      }

      AsyncFunction("addPostalAddress") Coroutine { self: Contact, postalAddressRecord: PostalAddressRecord.New ->
        self.postalAddresses.add(postalAddressRecord)
      }

      AsyncFunction("updatePostalAddress") Coroutine { self: Contact, postalAddressRecord: PostalAddressRecord.Existing ->
        self.postalAddresses.update(postalAddressRecord)
      }

      AsyncFunction("deletePostalAddress") Coroutine { self: Contact, postalAddressRecord: PostalAddressRecord.Existing ->
        self.postalAddresses.delete(postalAddressRecord)
      }

      AsyncFunction("getDates") Coroutine { self: Contact ->
        self.dates.getAll()
      }

      AsyncFunction("addDate") Coroutine { self: Contact, dateRecord: DateRecord.New ->
        self.dates.add(dateRecord)
      }

      AsyncFunction("updateDate") Coroutine { self: Contact, dateRecord: DateRecord.Existing ->
        self.dates.update(dateRecord)
      }

      AsyncFunction("deleteDate") Coroutine { self: Contact, dateRecord: DateRecord.Existing ->
        self.dates.delete(dateRecord)
      }

      AsyncFunction("getExtraNames") Coroutine { self: Contact ->
        self.extraNames.getAll()
      }

      AsyncFunction("addExtraName") Coroutine { self: Contact, extraNameRecord: ExtraNameRecord.New ->
        self.extraNames.add(extraNameRecord)
      }

      AsyncFunction("updateExtraName") Coroutine { self: Contact, extraNameRecord: ExtraNameRecord.Existing ->
        self.extraNames.update(extraNameRecord)
      }

      AsyncFunction("deleteExtraName") Coroutine { self: Contact, extraNameRecord: ExtraNameRecord.Existing ->
        self.extraNames.delete(extraNameRecord)
      }

      AsyncFunction("getRelationships") Coroutine { self: Contact ->
        self.relationships.getAll()
      }

      AsyncFunction("addRelationship") Coroutine { self: Contact, relationshipRecord: RelationshipRecord.New ->
        self.relationships.add(relationshipRecord)
      }

      AsyncFunction("updateRelationship") Coroutine { self: Contact, relationshipRecord: RelationshipRecord.Existing ->
        self.relationships.update(relationshipRecord)
      }

      AsyncFunction("deleteRelationship") Coroutine { self: Contact, relationshipRecord: RelationshipRecord.Existing ->
        self.relationships.delete(relationshipRecord)
      }

      AsyncFunction("getUrlAddresses") Coroutine { self: Contact ->
        self.urlAddresses.getAll()
      }

      AsyncFunction("addUrlAddress") Coroutine { self: Contact, urlAddressRecord: UrlAddressRecord.New ->
        self.urlAddresses.add(urlAddressRecord)
      }

      AsyncFunction("updateUrlAddress") Coroutine { self: Contact, urlAddressRecord: UrlAddressRecord.Existing ->
        self.urlAddresses.update(urlAddressRecord)
      }

      AsyncFunction("deleteUrlAddress") Coroutine { self: Contact, urlAddressRecord: UrlAddressRecord.Existing ->
        self.urlAddresses.delete(urlAddressRecord)
      }

      AsyncFunction("editWithForm") Coroutine { self: Contact ->
        self.editWithForm()
      }
    }

    AsyncFunction("createContact") Coroutine { createContactRecord: CreateContactRecord ->
      permissionsDelegate.ensurePermissions()
      Contact.create(createContactRecord, contactRepository, contactMapper, contactFactory)
    }

    AsyncFunction("addWithFormContact") Coroutine { createContactRecord: CreateContactRecord ->
      Contact.createWithForm(createContactRecord, contactMapper, contactIntentDelegate)
    }

    AsyncFunction("pickContact") Coroutine { ->
      Contact.pick(contactIntentDelegate, contactFactory)
    }

    AsyncFunction("getAllContact") Coroutine { ->
      Contact.getAll(contactRepository, contactFactory)
    }

    AsyncFunction("getAllWithDetailsContact") Coroutine { fields: List<ContactField> ->
      Contact.getAllWithDetails(contactRepository, contactMapper, fields)
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      permissionsDelegate.requestPermissions(promise)
    }

    AsyncFunction("getPermissions") { promise: Promise ->
      permissionsDelegate.getPermissions(promise)
    }

    Events(ContactsObserverDelegate.ON_CONTACTS_CHANGE_EVENT_NAME)

    OnDestroy {
      observerDelegate.stopObservingContactChanges()
    }

    OnStartObserving(ContactsObserverDelegate.ON_CONTACTS_CHANGE_EVENT_NAME) {
      observerDelegate.startObservingContactChanges()
    }

    OnStopObserving(ContactsObserverDelegate.ON_CONTACTS_CHANGE_EVENT_NAME) {
      observerDelegate.stopObservingContactChanges()
    }

    RegisterActivityContracts {
      with(contactIntentDelegate) {
        registerContactContracts()
      }
    }
  }
}
