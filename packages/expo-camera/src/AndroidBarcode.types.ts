// //    when (barcode.valueType) {
//   Barcode.TYPE_CONTACT_INFO -> {
//     val info = barcode.contactInfo
//     result.apply {
//       putString("type", "contactInfo")
//       putString("firstName", info?.name?.first)
//       putString("middleName", info?.name?.middle)
//       putString("lastName", info?.name?.last)
//       putString("title", info?.title)
//       putString("organization", info?.organization)
//       putString("email", info?.emails?.firstOrNull()?.address)
//       putString("phone", info?.phones?.firstOrNull()?.number)
//       putString("url", info?.urls?.firstOrNull())
//       putString("address", info?.addresses?.firstOrNull()?.addressLines?.firstOrNull())
//     }
//   }

//   Barcode.TYPE_GEO -> {
//     val geo = barcode.geoPoint
//     result.apply {
//       putString("type", "geoPoint")
//       putString("lat", geo?.lat.toString())
//       putString("lng", geo?.lng.toString())
//     }
//   }

//   Barcode.TYPE_SMS -> {
//     val sms = barcode.sms
//     result.apply {
//       putString("type", "sms")
//       putString("phoneNumber", sms?.phoneNumber)
//       putString("message", sms?.message)
//     }
//   }

//   Barcode.TYPE_URL -> {
//     val url = barcode.url
//     result.putString("type", "url")
//     result.putString("url", url?.url)
//   }

//   Barcode.TYPE_CALENDAR_EVENT -> {
//     val event = barcode.calendarEvent
//     result.apply {
//       result.putString("type", "calendarEvent")
//       putString("summary", event?.summary)
//       putString("description", event?.description)
//       putString("location", event?.location)
//       putString("start", event?.start?.toString())
//       putString("end", event?.end?.toString())
//     }
//   }

//   Barcode.TYPE_DRIVER_LICENSE -> {
//     val license = barcode.driverLicense
//     result.apply {
//       result.putString("type", "driverLicense")
//       putString("firstName", license?.firstName)
//       putString("middleName", license?.middleName)
//       putString("lastName", license?.lastName)
//       putString("licenseNumber", license?.licenseNumber)
//       putString("expiryDate", license?.expiryDate)
//       putString("issueDate", license?.issueDate)
//       putString("addressStreet", license?.addressStreet)
//       putString("addressCity", license?.addressCity)
//       putString("addressState", license?.addressState)
//     }
//   }

//   Barcode.TYPE_EMAIL -> {
//     val email = barcode.email
//     result.apply {
//       result.putString("type", "email")
//       putString("address", email?.address)
//       putString("subject", email?.subject)
//       putString("body", email?.body)
//     }
//   }

//   Barcode.TYPE_PHONE -> {
//     val phone = barcode.phone
//     result.apply {
//       result.putString("type", "phone")
//       putString("number", phone?.number)
//       putString("type", phone?.type.toString())
//     }
//   }

//   Barcode.TYPE_WIFI -> {
//     val wifi = barcode.wifi
//     result.apply {
//       result.putString("type", "wifi")
//       putString("ssid", wifi?.ssid)
//       putString("password", wifi?.password)
//       putString("type", wifi?.encryptionType.toString())
//     }
//   }

interface AndroidBarcodeType {
  type:
    | 'contactInfo'
    | 'geoPoint'
    | 'sms'
    | 'url'
    | 'calendarEvent'
    | 'driverLicense'
    | 'email'
    | 'phone'
    | 'wifi';
}

interface ContactInfoBarcode extends AndroidBarcodeType {
  type: 'contactInfo';
  firstName?: string;
  middleName?: string;
  lastName?: string;
  title?: string;
  organization?: string;
  email?: string;
  phone?: string;
  url?: string;
  address?: string;
}

interface GeoPointBarcode extends AndroidBarcodeType {
  type: 'geoPoint';
  lat: string;
  lng: string;
}

interface SmsBarcode extends AndroidBarcodeType {
  type: 'sms';
  phoneNumber?: string;
  message?: string;
}

interface UrlBarcode extends AndroidBarcodeType {
  type: 'url';
  url?: string;
}

interface CalendarEventBarcode extends AndroidBarcodeType {
  type: 'calendarEvent';
  summary?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
}

interface DriverLicenseBarcode extends AndroidBarcodeType {
  type: 'driverLicense';
  firstName?: string;
  middleName?: string;
  lastName?: string;
  licenseNumber?: string;
  expiryDate?: string;
  issueDate?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
}

interface EmailBarcode extends AndroidBarcodeType {
  type: 'email';
  address?: string;
  subject?: string;
  body?: string;
}

interface PhoneBarcode extends AndroidBarcodeType {
  type: 'phone';
  number?: string;
  phoneNumberType?: string;
}

interface WifiBarcode extends AndroidBarcodeType {
  type: 'wifi';
  ssid?: string;
  password?: string;
  encryptionType?: string;
}

export type AndroidBarcode =
  | ContactInfoBarcode
  | GeoPointBarcode
  | SmsBarcode
  | UrlBarcode
  | CalendarEventBarcode
  | DriverLicenseBarcode
  | EmailBarcode
  | PhoneBarcode
  | WifiBarcode;
