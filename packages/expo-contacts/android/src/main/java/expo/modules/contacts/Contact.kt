package expo.modules.contacts

import android.net.Uri
import android.util.Log
import android.os.Bundle
import android.text.TextUtils
import android.database.Cursor
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.content.ContentValues
import android.provider.ContactsContract
import android.content.ContentProviderOperation
import android.provider.ContactsContract.RawContacts
import android.provider.ContactsContract.CommonDataKinds
import android.provider.ContactsContract.CommonDataKinds.StructuredName

import expo.modules.contacts.models.DateModel
import expo.modules.contacts.models.EmailModel
import expo.modules.contacts.models.ImAddressModel
import expo.modules.contacts.models.PhoneNumberModel
import expo.modules.contacts.models.PostalAddressModel
import expo.modules.contacts.models.RelationshipModel
import expo.modules.contacts.models.UrlAddressModel
import expo.modules.contacts.models.ExtraNameModel
import expo.modules.contacts.models.BaseModel

import java.util.*
import java.lang.Exception
import java.text.ParseException
import java.text.SimpleDateFormat
import java.io.ByteArrayOutputStream

// TODO: MaidenName Nickname
class Contact(internal var contactId: String) {
  internal var rawContactId: String? = null
  internal var lookupKey: String? = null
  internal var displayName: String? = null
  internal var isMe = false
  internal var hasPhoto = false
  internal var photoUri: String? = null
  internal var rawPhotoUri: String? = null
  internal var contactType = "person"
  internal var firstName: String? = ""
  internal var middleName: String? = ""
  internal var lastName: String? = ""

  // protected String nickname = "";
  internal var prefix = ""
  internal var suffix = ""
  internal var phoneticFirstName = ""
  internal var phoneticMiddleName = ""
  internal var phoneticLastName = ""
  internal var company: String? = ""
  internal var department = ""
  internal var jobTitle = ""
  internal var note: String? = null
  internal var dates: MutableList<BaseModel> = arrayListOf()
  internal var emails: MutableList<BaseModel> = arrayListOf()
  internal var imAddresses: MutableList<BaseModel> = arrayListOf()
  internal var phones: MutableList<BaseModel> = arrayListOf()
  internal var addresses: MutableList<BaseModel> = arrayListOf()
  internal var relationships: MutableList<BaseModel> = arrayListOf()
  internal var urlAddresses: MutableList<BaseModel> = arrayListOf()
  internal var extraNames: MutableList<BaseModel> = arrayListOf()

  fun fromCursor(cursor: Cursor) {
    rawContactId = cursor.getString(cursor.getColumnIndex(ContactsContract.Data.RAW_CONTACT_ID))
    val mimeType = cursor.getString(cursor.getColumnIndex(ContactsContract.Data.MIMETYPE))
    val name = cursor.getString(cursor.getColumnIndex(ContactsContract.Contacts.DISPLAY_NAME))

    if (!TextUtils.isEmpty(name) && TextUtils.isEmpty(displayName)) {
      displayName = name
    }
    if (TextUtils.isEmpty(rawPhotoUri)) {
      val rawPhotoURI = cursor.getString(cursor.getColumnIndex(EXColumns.PHOTO_URI))
      if (!TextUtils.isEmpty(rawPhotoURI)) {
        hasPhoto = true
        rawPhotoUri = rawPhotoURI
      }
    }
    if (TextUtils.isEmpty(photoUri)) {
      val rawPhotoURI = cursor.getString(cursor.getColumnIndex(EXColumns.PHOTO_THUMBNAIL_URI))
      if (!TextUtils.isEmpty(rawPhotoURI)) {
        hasPhoto = true
        photoUri = rawPhotoURI
      }
    }

    // this.isMe = cursor.getInt(cursor.getColumnIndex(EXColumns.IS_PRIMARY)) == 1;

    when (mimeType) {
      StructuredName.CONTENT_ITEM_TYPE -> {
        with(cursor) {
          lookupKey = getString(getColumnIndex(StructuredName.LOOKUP_KEY))
          firstName = getString(getColumnIndex(StructuredName.GIVEN_NAME))
          middleName = getString(getColumnIndex(StructuredName.MIDDLE_NAME))
          lastName = getString(getColumnIndex(StructuredName.FAMILY_NAME))
          prefix = getString(getColumnIndex(StructuredName.PREFIX))
          suffix = getString(getColumnIndex(StructuredName.SUFFIX))
          phoneticFirstName = getString(getColumnIndex(StructuredName.PHONETIC_GIVEN_NAME))
          phoneticMiddleName = getString(getColumnIndex(StructuredName.PHONETIC_MIDDLE_NAME))
          phoneticLastName = getString(getColumnIndex(StructuredName.PHONETIC_FAMILY_NAME))
        }
      }
      CommonDataKinds.Organization.CONTENT_ITEM_TYPE -> {
        with(cursor) {
          company = getString(getColumnIndex(CommonDataKinds.Organization.COMPANY))
          jobTitle = getString(getColumnIndex(CommonDataKinds.Organization.TITLE))
          department = getString(getColumnIndex(CommonDataKinds.Organization.DEPARTMENT))
        }
      }
      CommonDataKinds.Note.CONTENT_ITEM_TYPE -> {
        with(cursor) {
          note = getString(getColumnIndex(CommonDataKinds.Note.NOTE))
        }
      }
      CommonDataKinds.Event.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = DateModel().also { fromCursor(cursor) }
        dates.add(item)
      }
      CommonDataKinds.Email.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = EmailModel().also { fromCursor(cursor) }
        emails.add(item)
      }
      CommonDataKinds.Im.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = ImAddressModel().also { fromCursor(cursor) }
        imAddresses.add(item)
      }
      CommonDataKinds.Phone.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = PhoneNumberModel().also { fromCursor(cursor) }
        phones.add(item)
      }
      CommonDataKinds.StructuredPostal.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = PostalAddressModel().also { fromCursor(cursor) }
        addresses.add(item)
      }
      CommonDataKinds.Relation.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = RelationshipModel().also { fromCursor(cursor) }
        relationships.add(item)
      }
      CommonDataKinds.Website.CONTENT_ITEM_TYPE -> {
        val urlAddressModel: BaseModel = UrlAddressModel().also { fromCursor(cursor) }
        urlAddresses.add(urlAddressModel)
      }
      CommonDataKinds.Nickname.CONTENT_ITEM_TYPE -> {
        val item: BaseModel = ExtraNameModel().also { fromCursor(cursor) }
        extraNames.add(item)
      }
    }

    contactType = if (!company.isNullOrEmpty()) {
      if (firstName.isNullOrEmpty() && middleName.isNullOrEmpty() && lastName.isNullOrEmpty()) {
        "company"
      } else {
        "person"
      }
    } else {
      "person"
    }
  }

  fun firstName() = firstName ?: (displayName ?: "")

  fun lastName() = lastName ?: (displayName ?: "")

  fun displayName() =
    if (displayName == null && firstName != null) {
      if (lastName == null) firstName
      else String.format("%s %s", firstName, lastName).trim { it <= ' ' }
    } else displayName

  fun toByteArray(bitmap: Bitmap): ByteArray {
    val stream = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.JPEG, 80, stream)
    return stream.toByteArray()
  }

  fun toInsertOperationList(): ArrayList<ContentProviderOperation> {
    val ops = ArrayList<ContentProviderOperation>()
    var op = ContentProviderOperation.newInsert(RawContacts.CONTENT_URI)
      .withValue(RawContacts.ACCOUNT_TYPE, null)
      .withValue(RawContacts.ACCOUNT_NAME, null)
    ops.add(op.build())

    op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
      .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
      .withValue(ContactsContract.Data.MIMETYPE, StructuredName.CONTENT_ITEM_TYPE)
      .withValue(StructuredName.DISPLAY_NAME, displayName)
      .withValue(StructuredName.GIVEN_NAME, firstName)
      .withValue(StructuredName.MIDDLE_NAME, middleName)
      .withValue(StructuredName.FAMILY_NAME, lastName)
      .withValue(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
      .withValue(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
      .withValue(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      .withValue(StructuredName.PREFIX, prefix)
      .withValue(StructuredName.SUFFIX, suffix)
    ops.add(op.build())

    op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
      .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
      .withValue(EXColumns.MIMETYPE, CommonDataKinds.Organization.CONTENT_ITEM_TYPE)
      .withValue(CommonDataKinds.Organization.COMPANY, company)
      .withValue(CommonDataKinds.Organization.TITLE, jobTitle)
      .withValue(CommonDataKinds.Organization.DEPARTMENT, department)
    ops.add(op.build())

    op = ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
      .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
      .withValue(EXColumns.MIMETYPE, CommonDataKinds.Note.CONTENT_ITEM_TYPE)
      .withValue(CommonDataKinds.Note.NOTE, note)
    ops.add(op.build())

    op.withYieldAllowed(true)

    if (!TextUtils.isEmpty(photoUri) || !TextUtils.isEmpty(rawPhotoUri)) {
      val photo = getThumbnailBitmap(if (TextUtils.isEmpty(rawPhotoUri)) photoUri else rawPhotoUri)
      if (photo != null) {
        ops.add(
          ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
            .withValueBackReference(ContactsContract.Data.RAW_CONTACT_ID, 0)
            .withValue(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
            .withValue(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
            .build()
        )
      }
    }
    // TODO: `addAll` or refractor this somehow
    baseModels
      .filterNotNull()
      .forEach { map ->
        map.forEach { item ->
          ops.add(item.insertOperation)
        }
      }
    return ops
  }

  fun toUpdateOperationList(): ArrayList<ContentProviderOperation?> {
    val selection = String.format("%s=? AND %s=?", ContactsContract.Data.CONTACT_ID, ContactsContract.Data.MIMETYPE)
    val selectionArgs = arrayOf(contactId, StructuredName.CONTENT_ITEM_TYPE)
    val ops = arrayListOf<ContentProviderOperation?>()
    var op: ContentProviderOperation.Builder

    op = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
      .withSelection(selection, selectionArgs)
      .withValue(StructuredName.DISPLAY_NAME, displayName)
      .withValue(StructuredName.GIVEN_NAME, firstName)
      .withValue(StructuredName.MIDDLE_NAME, middleName)
      .withValue(StructuredName.FAMILY_NAME, lastName)
      .withValue(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
      .withValue(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
      .withValue(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      .withValue(StructuredName.PREFIX, prefix).withValue(StructuredName.SUFFIX, suffix)
    ops.add(op.build())

    op = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
      .withSelection(selection, selectionArgs)
      .withValue(CommonDataKinds.Organization.COMPANY, company)
      .withValue(CommonDataKinds.Organization.TITLE, jobTitle)
      .withValue(CommonDataKinds.Organization.DEPARTMENT, department)
    ops.add(op.build())

    op = ContentProviderOperation.newUpdate(ContactsContract.Data.CONTENT_URI)
      .withSelection(selection, arrayOf(contactId, CommonDataKinds.Note.CONTENT_ITEM_TYPE))
      .withValue(CommonDataKinds.Note.NOTE, note)
    ops.add(op.build())

    op.withYieldAllowed(true)

    if (!photoUri.isNullOrEmpty() || !rawPhotoUri.isNullOrEmpty()) {
      val photo = getThumbnailBitmap(if (TextUtils.isEmpty(rawPhotoUri)) photoUri else rawPhotoUri)
      if (photo != null) {
        ops.add(
          ContentProviderOperation.newDelete(ContactsContract.Data.CONTENT_URI)
            .withSelection(selection, arrayOf(rawContactId, CommonDataKinds.Photo.CONTENT_ITEM_TYPE))
            .build()
        )
        ops.add(
          ContentProviderOperation.newInsert(ContactsContract.Data.CONTENT_URI)
            .withValue(ContactsContract.Data.RAW_CONTACT_ID, rawContactId)
            .withValue(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
            .withValue(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
            .build()
        )
      }
    }

    baseModels.forEach { map ->
      map?.forEach { item ->
        ops.add(item.getDeleteOperation(rawContactId))
        ops.add(item.getInsertOperation(rawContactId))
      }
    }
    return ops
  }

  internal val baseModels: List<MutableList<BaseModel>> =
    listOf(dates, emails, imAddresses, phones, addresses, relationships, urlAddresses, extraNames)

  // convert to react native object
  @Throws(ParseException::class)
  fun toMap(fieldSet: Set<String?>): Bundle {
    val contact = Bundle().apply {
      putBoolean("imageAvailable", hasPhoto)
      putString("lookupKey", lookupKey)
      putString("id", contactId)
      putString("name", if (!TextUtils.isEmpty(displayName)) displayName else "$firstName $lastName")
      putString("contactType", contactType)
    }

    if (!firstName.isNullOrEmpty()) contact.putString("firstName", firstName)
    if (!middleName.isNullOrEmpty()) contact.putString("middleName", middleName)
    if (!lastName.isNullOrEmpty()) contact.putString("lastName", lastName)
    if (!company.isNullOrEmpty()) contact.putString("company", company)
    if (suffix.isNotEmpty()) contact.putString("nameSuffix", suffix)
    if (prefix.isNotEmpty()) contact.putString("namePrefix", prefix)
    if (phoneticFirstName.isNotEmpty()) contact.putString("phoneticFirstName", phoneticFirstName)
    if (phoneticLastName.isNotEmpty()) contact.putString("phoneticLastName", phoneticLastName)
    if (phoneticMiddleName.isNotEmpty()) contact.putString("phoneticMiddleName", phoneticMiddleName)
    if (jobTitle.isNotEmpty()) contact.putString("jobTitle", jobTitle)
    if (department.isNotEmpty()) contact.putString("department", department)

    if ("image" in fieldSet && photoUri != null) {
      val image = Bundle().apply { putString("uri", photoUri) }
      contact.putBundle("image", image)
    }
    if ("rawImage" in fieldSet && rawPhotoUri != null) {
      val image = Bundle().apply { putString("uri", rawPhotoUri) }
      contact.putBundle("image", image)
    }
    if ("note" in fieldSet && !TextUtils.isEmpty(note)) {
      contact.putString("note", note)
    }
    if ("phoneNumbers" in fieldSet && phones.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in phones) items.add(item.map)
      contact.putParcelableArrayList("phoneNumbers", items)
    }
    if ("emails" in fieldSet && emails.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in emails) items.add(item.map)
      contact.putParcelableArrayList("emails", items)
    }
    if ("addresses" in fieldSet && addresses.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in addresses) items.add(item.map)
      contact.putParcelableArrayList("addresses", items)
    }
    if ("instantMessageAddresses" in fieldSet && imAddresses.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in imAddresses) items.add(item.map)
      contact.putParcelableArrayList("instantMessageAddresses", items)
    }
    if ("urlAddresses" in fieldSet && urlAddresses.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in urlAddresses) items.add(item.map)
      contact.putParcelableArrayList("urlAddresses", items)
    }
    if ("relationships" in fieldSet && relationships.isNotEmpty()) {
      val items = arrayListOf<Bundle?>()
      for (item in relationships) items.add(item.map)
      contact.putParcelableArrayList("relationships", items)
    }
    if (extraNames.isNotEmpty()) {
      val showNickname = fieldSet.contains("nickname")
      val showMaidenName = fieldSet.contains("maidenName")
      for (i in extraNames.indices) {
        val item = extraNames[i] as ExtraNameModel
        val data = item.data
        val label = item.label
        if (showMaidenName && label != null && label == "maidenName") {
          if (!TextUtils.isEmpty(data)) contact.putString(label, data)
        }
        if (showNickname && label != null && label == "nickname") {
          if (!TextUtils.isEmpty(data)) contact.putString(label, data)
        }
      }
      // WritableArray items = Arguments.createArray();
      // items.pushMap(item.getMap());
      // contact.putArray("extraNames", items);
    }
    val showBirthday = "birthday" in fieldSet
    val showDates = "dates" in fieldSet
    if (showDates || showBirthday) { // double if check with query with cursor
      var hasYear: Boolean
      val rawDatesArray = arrayListOf<Bundle?>()
      val datesArray = arrayListOf<Bundle?>()
      for (item in dates) {
        val calendar = Calendar.getInstance()
        val datePattern = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val noYearPattern = SimpleDateFormat("--MM-dd", Locale.getDefault())
        val details = Bundle()
        val dateString = item.data
        val label = item.label
        val rawDate = Bundle().apply {
          putString("type", label)
          putString("value", dateString)
        }
        rawDatesArray.add(rawDate)
        try {
          hasYear = !dateString!!.startsWith("--")
          if (hasYear) {
            calendar.time = datePattern.parse(dateString) as Date
          } else {
            calendar.time = noYearPattern.parse(dateString) as Date
          }
          if (hasYear) {
            details.putInt("year", calendar[Calendar.YEAR])
          }
          details.putInt("month", calendar[Calendar.MONTH])
          details.putInt("day", calendar[Calendar.DAY_OF_MONTH])
          // TODO: Evan: The type is only supported in 26+
          details.putString("format", "gregorian")
          if (showBirthday && label != null && label == "birthday") {
            contact.putBundle("birthday", details)
          } else {
            details.putString("label", label)
            datesArray.add(details)
          }
        } catch (e: Exception) {
          Log.w("Contact", e.toString())
        }
      }
      if (showDates) {
        if (datesArray.size > 0) {
          contact.putParcelableArrayList("dates", datesArray)
        }
      }
      if (rawDatesArray.size > 0) {
        contact.putParcelableArrayList("rawDates", rawDatesArray)
      }
    }
    return contact
  }

  val contentValues: ArrayList<ContentValues>
    get() {
      val contactData = ArrayList<ContentValues>()
      val name = ContentValues().apply {
        put(ContactsContract.Contacts.Data.MIMETYPE, CommonDataKinds.Identity.CONTENT_ITEM_TYPE)
        put(StructuredName.GIVEN_NAME, firstName)
        put(StructuredName.MIDDLE_NAME, middleName)
        put(StructuredName.FAMILY_NAME, lastName)
        put(StructuredName.PREFIX, prefix)
        put(StructuredName.SUFFIX, suffix)
        put(StructuredName.PHONETIC_GIVEN_NAME, phoneticFirstName)
        put(StructuredName.PHONETIC_MIDDLE_NAME, phoneticMiddleName)
        put(StructuredName.PHONETIC_FAMILY_NAME, phoneticLastName)
      }
      contactData.add(name)

      val organization = ContentValues().apply {
        put(ContactsContract.Data.MIMETYPE, CommonDataKinds.Organization.CONTENT_ITEM_TYPE)
        put(CommonDataKinds.Organization.COMPANY, company)
        put(CommonDataKinds.Organization.TITLE, jobTitle)
        put(CommonDataKinds.Organization.DEPARTMENT, department)
      }
      contactData.add(organization)

      val notes = ContentValues().apply {
        put(ContactsContract.Data.MIMETYPE, CommonDataKinds.Note.CONTENT_ITEM_TYPE)
        put(CommonDataKinds.Note.NOTE, note)
      }
      contactData.add(notes)

      photoUri?.let { photoUri ->
        if (photoUri.isNotEmpty()) {
          val photo = getThumbnailBitmap(Uri.parse(photoUri).path)
          if (photo != null) {
            val image = ContentValues().apply {
              put(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
              put(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
            }
            contactData.add(image)
          }
        }
      }

      rawPhotoUri?.let { rawPhotoUri ->
        if (rawPhotoUri.isNotEmpty()) {
          val photo = getThumbnailBitmap(rawPhotoUri)
          if (photo != null) {
            val image = ContentValues().apply {
              put(EXColumns.MIMETYPE, CommonDataKinds.Photo.CONTENT_ITEM_TYPE)
              put(CommonDataKinds.Photo.PHOTO, toByteArray(photo))
            }
            contactData.add(image)
          }
        }
      }

      baseModels.forEach { map ->
        map?.forEach { item ->
          contactData.add(item.contentValues)
        }
      }

      return contactData
    }

  private fun getThumbnailBitmap(photoUri: String?): Bitmap =
    BitmapFactory.decodeFile(Uri.parse(photoUri).path)
}
