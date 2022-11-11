//
//  SMSOptions.swift
//  ExpoSMS
//
//  Created by Alan Hughes on 11/11/2022.
//

import ExpoModulesCore

struct SmsOptions: Record {
    @Field var attachments: [SmsAttachment]
}

struct SmsAttachment: Record {
    @Field var uri: String
    @Field var mimeType: String
    @Field var filename: String
}
