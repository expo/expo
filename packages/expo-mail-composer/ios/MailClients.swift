import ExpoModulesCore

struct MailClient: Record {
  init() {}

  @Field var label: String
  @Field var url: String

  init(label: String, url: String) {
    self.label = label
    self.url = url
  }
}

/**
 A list of mail clients with their labels and URL schemes.
 Keep the list in sync with those in the file `plugin/src/withMailComposer.ts`.
*/
let mailClients: [MailClient] = [
  MailClient(label: "Airmail", url: "airmail://"),
  MailClient(label: "Apple Mail", url: "message://"),
  MailClient(label: "BlueMail", url: "bluemail://"),
  MailClient(label: "Canary", url: "canary://"),
  MailClient(label: "Edison Mail", url: "edisonmail://"),
  MailClient(label: "Email.cz", url: "szn-email://"),
  MailClient(label: "Fastmail", url: "fastmail://"),
  MailClient(label: "GMX Mail", url: "x-gmxmail-netid-v1://"),
  MailClient(label: "Gmail", url: "googlegmail://"),
  MailClient(label: "Mail.ru", url: "mailrumail://"),
  MailClient(label: "Outlook", url: "ms-outlook://"),
  MailClient(label: "Proton Mail", url: "protonmail://"),
  MailClient(label: "Secure Mail", url: "ctxmail://"),
  MailClient(label: "Spark", url: "readdle-spark://"),
  MailClient(label: "Superhuman", url: "superhuman://"),
  MailClient(label: "Telekom Mail", url: "telekommail://"),
  MailClient(label: "Tuta Mail", url: "tutanota://"),
  MailClient(label: "WEB.DE Mail", url: "x-webdemail-netid-v1://"),
  MailClient(label: "Yahoo Mail", url: "ymail://"),
  MailClient(label: "Yandex Mail", url: "yandexmail://"),
  MailClient(label: "freenet Mail", url: "appcenter-f45b4c0b-75c9-2d01-7ab6-41f6a6015be2://"),
  MailClient(label: "myMail", url: "mymail-mailto://")
]
