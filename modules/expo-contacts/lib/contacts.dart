import 'dart:async';

import 'package:expo_flutter_adapter/expo_modules_proxy.dart';

class Field {
  static const phoneNumbers = const Field._fromString('phoneNumbers');
  static const emails = const Field._fromString('emails');
  static const addresses = const Field._fromString('addresses');
  static const image = const Field._fromString('image');
  static const thumbnail = const Field._fromString('thumbnail');
  static const note = const Field._fromString('note');
  static const birthday = const Field._fromString('birthday');
  static const nonGregorianBirthday =
      const Field._fromString('nonGregorianBirthday');
  static const namePrefix = const Field._fromString('namePrefix');
  static const nameSuffix = const Field._fromString('nameSuffix');
  static const phoneticFirstName =
      const Field._fromString('phoneticFirstName');
  static const phoneticMiddleName =
      const Field._fromString('phoneticMiddleName');
  static const phoneticLastName =
      const Field._fromString('phoneticLastName');
  static const socialProfiles = const Field._fromString('socialProfiles');
  static const instantMessageAddresses =
      const Field._fromString('instantMessageAddresses');
  static const urlAddresses = const Field._fromString('urlAddresses');
  static const dates = const Field._fromString('dates');
  static const relationships = const Field._fromString('relationships');

  final String _bridgeString;

  const Field._fromString(this._bridgeString);

  String _toString() => this._bridgeString;
}

class Labelled {
  final String id;
  final String label;

  Labelled._fromMap(Map map)
      : id = map['id'],
        label = map['label'];
}

class PhoneNumber extends Labelled {
  final String number;
  final String digits;
  final bool primary;
  final String countryCode;

  PhoneNumber._fromMap(Map map)
      : number = map['number'],
        digits = map['digits'],
        primary = map['primary'],
        countryCode = map['countryCode'],
        super._fromMap(map);
}

class Email extends Labelled {
  final String email;
  final bool primary;

  Email._fromMap(Map map)
      : email = map['email'],
        primary = map['primary'],
        super._fromMap(map);
}

class Address extends Labelled {
  final String street;
  final String city;
  final String country;
  final String region;
  final String neighborhood;
  final String postalCode;
  final String poBox;
  final String isoCountryCode;

  Address._fromMap(Map map)
      : street = map['street'],
        city = map['city'],
        country = map['country'],
        region = map['region'],
        neighborhood = map['neighborhood'],
        postalCode = map['postalCode'],
        poBox = map['poBox'],
        isoCountryCode = map['isoCountryCode'],
        super._fromMap(map);
}

class SocialProfile extends Labelled {
  final String service;
  final String localizedProfile;
  final String url;
  final String username;
  final String userId;

  SocialProfile._fromMap(Map map)
      : service = map['service'],
        localizedProfile = map['localizedProfile'],
        url = map['url'],
        username = map['username'],
        userId = map['userId'],
        super._fromMap(map);
}

class InstantMessageAddress extends Labelled {
  final String service;
  final String username;
  final String localizedService;

  InstantMessageAddress._fromMap(Map map)
      : service = map['service'],
        username = map['username'],
        localizedService = map['localizedService'],
        super._fromMap(map);
}

class UrlAddress extends Labelled {
  final String url; // TODO(nikki): Use system `Uri` type for this?

  UrlAddress._fromMap(Map map)
      : url = map['url'],
        super._fromMap(map);
}

class Date extends Labelled {
  final int day; // TODO(nikki): Use system `Date` type for these?
  final int month;
  final int year;

  Date._fromMap(Map map)
      : day = map['day']?.toInt(),
        month = map['month']?.toInt(),
        year = map['year']?.toInt(),
        super._fromMap(map);
}

class Relationship extends Labelled {
  final String name;

  Relationship._fromMap(Map map)
      : name = map['name'],
        super._fromMap(map);
}

class Image {
  final String uri; // TODO(nikki): Use system `Image` type for this?

  Image._fromMap(Map map) : uri = map['uri'];
}

class Birthday {
  final int day; // TODO(nikki): Use system `Date` type for these?
  final int month;
  final int year;

  Birthday._fromMap(Map map)
      : day = map['day']?.toInt(),
        month = map['month']?.toInt(),
        year = map['year']?.toInt();
}

class Contact {
  final String id;
  final String name;
  final String firstName;
  final String middleName;
  final String lastName;
  final String previousLastName;
  final String namePrefix;
  final String nameSuffix;
  final String nickname;
  final String phoneticFirstName;
  final String phoneticMiddleName;
  final String phoneticLastName;
  final Birthday birthday;
  final Birthday nonGregorianBirthday;
  final Iterable<Email> emails;
  final Iterable<PhoneNumber> phoneNumbers;
  final Iterable<Address> addresses;
  final Iterable<SocialProfile> socialProfiles;
  final Iterable<InstantMessageAddress> instantMessageAddresses;
  final Iterable<UrlAddress> urlAddresses;
  final String company;
  final String jobTitle;
  final String department;
  final bool imageAvailable;
  final Image image;
  final Image thumbnail;
  final String note;
  final Iterable<Date> dates;
  final Iterable<Relationship> relationships;

  /// Converts from the format specified in https://github.com/expo/expo-sdk/blob/05adc59cfc69c1d523df09dc42881407163382a9/src/Contacts.js#L32-L126
  Contact._fromMap(Map map)
      : id = map['id'],
        name = map['name'],
        firstName = map['firstName'],
        middleName = map['middleName'],
        lastName = map['lastName'],
        previousLastName = map['previousLastName'],
        namePrefix = map['namePrefix'],
        nameSuffix = map['nameSuffix'],
        nickname = map['nickname'],
        phoneticFirstName = map['phoneticFirstName'],
        phoneticMiddleName = map['phoneticMiddleName'],
        phoneticLastName = map['phoneticLastName'],
        birthday = map['birthday'] != null
            ? new Birthday._fromMap(map['birthday'])
            : null,
        nonGregorianBirthday = map['nonGregorianBirthday'] != null
            ? new Birthday._fromMap(map['nonGregorianBirthday'])
            : null,
        emails = map['emails']
            ?.map((map) => new Email._fromMap(map))
            ?.cast<Email>(),
        phoneNumbers = map['phoneNumbers']
            ?.map((map) => new PhoneNumber._fromMap(map))
            ?.cast<PhoneNumber>(),
        addresses = map['addresses']
            ?.map((map) => new Address._fromMap(map))
            ?.cast<Address>(),
        socialProfiles = map['socialProfiles']
            ?.map((map) => new SocialProfile._fromMap(map))
            ?.cast<SocialProfile>(),
        instantMessageAddresses = map['instantMessageAddresses']
            ?.map((map) => new InstantMessageAddress._fromMap(map))
            ?.cast<InstantMessageAddress>(),
        urlAddresses = map['urlAddresses']
            ?.map((map) => new UrlAddress._fromMap(map))
            ?.cast<UrlAddress>(),
        company = map['company'],
        jobTitle = map['jobTitle'],
        department = map['department'],
        imageAvailable = map['imageAvailable'],
        image = map['image'] != null
            ? new Image._fromMap(map['image'])
            : null,
        thumbnail = map['thumbnail'] != null
            ? new Image._fromMap(map['thumbnail'])
            : null,
        note = map['note'],
        dates = map['dates']
            ?.map((map) => new Date._fromMap(map))
            ?.cast<Date>(),
        relationships = map['relationships']
            ?.map((map) => new Relationship._fromMap(map))
            ?.cast<Relationship>();
}

class Page {
  final Iterable<Contact> data;
  final int total;
  final bool hasNextPage;
  final bool hasPreviousPage;

  Page._fromMap(Map map)
      : data = map['data']
            ?.map((map) => new Contact._fromMap(map))
            ?.cast<Contact>(),
        total = map['total']?.toInt(),
        hasNextPage = map['hasNextPage'],
        hasPreviousPage = map['hasPreviousPage'];
}

class Contacts {
  static Future<Page> getContacts({
    final String id,
    List<Field> fields =
        const [], // TODO(nikki): Use `Set<Field>` here? But doesn't have a `const` constructor...
    final int pageSize = 100,
    final int pageOffset = 0,
  }) async {
    final Map options = {
      'fields': fields.map((field) => field._toString()).toList(),
      'pageSize': pageSize,
      'pageOffset': pageOffset,
    };
    if (id != null) {
      options['id'] = id;
    }
    final returned = await ExpoModulesProxy.callMethod(
      'ExponentContacts',
      'getContactsAsync',
      [options],
    );
    return new Page._fromMap(returned);
  }
}
