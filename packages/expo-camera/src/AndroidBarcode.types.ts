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
