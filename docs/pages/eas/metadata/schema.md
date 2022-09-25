---
title: Schema for EAS Metadata
sidebar_title: Metadata schema
sidebar_depth: 4
---

import { Callout } from '~/ui/components/Callout';
import { Collapsible } from '~/ui/components/Collapsible';
import { markdownComponents as MD } from '~/ui/components/Markdown';
import { CodeBlocksTable } from '~/components/plugins/CodeBlocksTable';
import {
  MetadataTable,
  MetadataSubcategories,
  MetadataNameCell,
  MetadataTypeCell,
  MetadataDescriptionCell,
} from '~/components/plugins/EasMetadataTable';

<Callout type="warning">EAS Metadata is in beta and subject to breaking changes.</Callout>
<br />

The store config in EAS Metadata contains information that otherwise would be provided manually through the app store dashboards.
This document outlines the structure of the object in your store config.

> If you use the [VS Code Expo plugin](https://github.com/expo/vscode-expo#readme), you get all this information through auto-complete, suggestions, and warnings in your editor.

## Config schema

An essential property in the store config object is the `configVersion` property.
App stores might require more or change existing information structures to publish your app.
This property helps versioning changes that are not backward compatible.

EAS Metadata _currently_ only supports the Apple App Store.

<MetadataTable>
{[
  { name: 'configVersion', type: 'number', rules: ['enum: 0'], description: 'The EAS Metadata store configuration schema version.' },
  { name: 'apple', type: 'object', description: 'All configurable properties for the App Store.' },
  { nested: 1, name: 'version', type: 'string', description: [
    <MD.p>The app version to use when syncing all metadata defined in the store config.</MD.p>,
    <MD.p>EAS Metadata selects the latest available version in the app stores by default.</MD.p>,
  ]},
  { nested: 1, name: 'copyright', type: 'string', description: 'The name of the person or entity that owns the exclusive rights to the app, preceded by the year the rights were obtained. (for example, "2008 Acme Inc.")'},
  { nested: 1, name: 'advisory', type: <MD.a href="#apple-advisory">AppleAdvisory</MD.a>, description: 'The App Store questionnaire to determine the app\'s age rating.' },
  { nested: 1, name: 'categories', type: <MD.a href="#apple-categories">AppleCategories</MD.a>, description: 'App Store categories for the app. You can add primary, secondary, and possible subcategories.' },
  {
    nested: 1,
    name: 'info',
    type: (
      <>
        {'Map<'}<MD.a href="#apple-info">AppleLanguage</MD.a>{', '}<MD.a href="#apple-info">AppleInfo</MD.a>{'>'}
      </>
    ),
    description: 'The localized App Store presence of your app.',
  },
  { nested: 1, name: 'release', type: <MD.a href="#apple-release">AppleRelease</MD.a>, description: 'The app release strategy for the selected version.' },
  { nested: 1, name: 'review', type: <MD.a href="#apple-review">AppleReview</MD.a>, description: 'All required information to review the app for the App Store review team, including contact info and credentials. (if applicable)' },
]}
</MetadataTable>

### Apple advisory

Apple uses a complex questionnaire to determine the app's [age rating](https://help.apple.com/app-store-connect/#/dev599d50efb).
Parental controls on the App Store use this calculated age rating.
EAS Metadata uses the least restrictive answer for each of these questions by default.

<Collapsible summary="Complete advisory with the least restrictive answers">
  <CodeBlocksTable tabs={['store.config.json']} style={{ marginTop: 0 }}>

```json
{
  "configVersion": 0,
  "apple": {
    "advisory": {
      "alcoholTobaccoOrDrugUseOrReferences": "NONE",
      "contests": "NONE",
      "gamblingSimulated": "NONE",
      "horrorOrFearThemes": "NONE",
      "matureOrSuggestiveThemes": "NONE",
      "medicalOrTreatmentInformation": "NONE",
      "profanityOrCrudeHumor": "NONE",
      "sexualContentGraphicAndNudity": "NONE",
      "sexualContentOrNudity": "NONE",
      "violenceCartoonOrFantasy": "NONE",
      "violenceRealistic": "NONE",
      "violenceRealisticProlongedGraphicOrSadistic": "NONE",
      "gambling": false,
      "unrestrictedWebAccess": false,
      "kidsAgeBand": null,
      "seventeenPlus": false
    }
  }
}
```

  </CodeBlocksTable>
</Collapsible>

<MetadataTable>
{[
  { name: 'alcoholTobaccoOrDrugUseOrReferences', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain alcohol, tobacco, or drug use or references?' },
  { name: 'contests', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain contests?' },
  { name: 'gambling', type: 'boolean', description: 'Does your app contain gambling?' },
  { name: 'gamblingSimulated', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain simulated gambling?' },
  { name: 'horrorOrFearThemes', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain horror or fear themes?' },
  { name: 'kidsAgeBand', type: <MD.a href="#apple-advisory-kids-age">AppleKidsAge</MD.a>, description: [
    <MD.p>When parents visit the Kids category on the App Store, they expect the apps they find will protect their children's data, provide only age-appropriate content, and require a parental gate in order to link out of the app, request permissions, or present purchasing opportunities.</MD.p>,
    <MD.p>It's critical that no personally identifiable information or device information be transmitted to third parties, and that advertisements are human-reviewed for age appropriateness in order to be displayed.</MD.p>,
    <MD.p>
      <MD.a openInNewTab href="https://developer.apple.com/news/?id=091202019a">Learn more</MD.a>
    </MD.p>
  ]},
  { name: 'matureOrSuggestiveThemes', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain mature or suggestive themes?' },
  { name: 'medicalOrTreatmentInformation', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain medical or treatment information?' },
  { name: 'profanityOrCrudeHumor', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain profanity or crude humor?' },
  { name: 'seventeenPlus', type: 'boolean', description: [
    <MD.p>If your app rates 12+ or lower, and you believe its content may not be suitable for children under 17, you can manually set the age rating to 17+.</MD.p>,
    <MD.p>
      <MD.a openInNewTab href="https://help.apple.com/app-store-connect/#/dev599d50efb">Learn more</MD.a>
    </MD.p>
  ]},
  { name: 'sexualContentGraphicAndNudity', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain graphic sexual content and nudity?' },
  { name: 'sexualContentOrNudity', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain sexual content or nudity?' },
  { name: 'unrestrictedWebAccess', type: 'boolean', description: 'Does your app contain unrestricted web access, such as with an embedded browser?' },
  { name: 'violenceCartoonOrFantasy', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain cartoon or fantasy violence?' },
  { name: 'violenceRealistic', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain realistic violence?' },
  { name: 'violenceRealisticProlongedGraphicOrSadistic', type: <MD.a href="#apple-advisory-age-rating">AppleAgeRating</MD.a>, description: 'Does the app contain prolonged graphic or sadistic realistic violence?' },
]}
</MetadataTable>

#### Apple advisory age rating

<MetadataTable headers={['Name', 'Description']}>
{[
  { name: 'NONE', description: 'For apps that do not use the subject whatsoever.' },
  { name: 'INFREQUENT_OR_MILD', description: 'For apps mentioning the subject or using the subject as a non-primary feature.' },
  { name: 'FREQUENT_OR_INTENSE', description: 'For apps using the subject as a primary feature.' },
]}
</MetadataTable>

#### Apple advisory kids age

<MetadataTable headers={['Name', 'Description']}>
{[
  { name: 'FIVE_AND_UNDER', description: 'For kids of 5 years old and below.' },
  { name: 'SIX_TO_EIGHT', description: 'For kids between the age of 6 to 8 years.' },
  { name: 'NINE_TO_ELEVEN', description: 'For kids between the age of 9 to 11 years.' }
]}
</MetadataTable>

### Apple categories

The App Store helps users discover new apps by [categorizing apps into categories](https://developer.apple.com/app-store/categories/), using primary, secondary, and possible subcategories.

<Collapsible summary="Primary and secondary category">
  <CodeBlocksTable tabs={['store.config.json']} style={{ marginTop: 0 }}>

```json
{
  "configVersion": 0,
  "apple": {
    "categories": ["FINANCE", "NEWS"]
  }
}
```

  </CodeBlocksTable>
</Collapsible>

<Collapsible summary="Primary, subcategories, and secondary category">
  <CodeBlocksTable tabs={['store.config.json']} style={{ marginTop: 0 }}>

```json
{
  "configVersion": 0,
  "apple": {
    "categories": [
      ["GAMES", "GAMES_CARD", "GAMES_BOARD"],
      "ENTERTAINMENT"
    ]
  }
}
```

  </CodeBlocksTable>
</Collapsible>

<MetadataTable key='apple.categories' headers={['Name', 'Description']}>
{[
  { name: 'BOOKS', description: 'Apps with content that is traditionally offered in printed form and which provide additional interactivity.' },
  { name: 'BUSINESS', description: 'Apps that assist with running a business or provide a means to collaborate, edit, or share business-related content.' },
  { name: 'DEVELOPER_TOOLS', description: 'Apps that assist users with developing, maintaining, or sharing software.' },
  { name: 'EDUCATION', description: 'Apps that provide an interactive learning experience on specific skills or subjects.' },
  { name: 'ENTERTAINMENT', description: 'Interactive apps designed to entertain the user with audio, visual, or other content.' },
  { name: 'FINANCE', description: 'Apps that provide financial services or information to assist users with business or personal finances.' },
  { name: 'FOOD_AND_DRINK', description: 'Apps that provide recommendations, instruction, or reviews related to preparing, consuming, or reviewing food or beverages.' },
  { name: 'GAMES', description: [
    <MD.p>Apps that provide single or multiplayer interactive experiences for entertainment purposes.</MD.p>,
    <MD.p>This category can have up to 2 subcategories.</MD.p>,
    <MD.p><MetadataSubcategories>{['GAMES_ACTION', 'GAMES_ADVENTURE', 'GAMES_BOARD', 'GAMES_CARD', 'GAMES_CASINO', 'GAMES_CASUAL', 'GAMES_FAMILY', 'GAMES_MUSIC', 'GAMES_PUZZLE', 'GAMES_RACING', 'GAMES_ROLE_PLAYING', 'GAMES_SIMULATION', 'GAMES_SPORTS', 'GAMES_STRATEGY', 'GAMES_TRIVIA', 'GAMES_WORD']}</MetadataSubcategories></MD.p>,
  ]},
  { name: 'GRAPHICS_AND_DESIGN', description: 'Apps that provide tools or tips for creating, editing, or sharing visual content.' },
  { name: 'HEALTH_AND_FITNESS', description: 'Apps related to healthy living, including stress management, fitness, and recreational activities.' },
  { name: 'LIFESTYLE', description: 'Apps related to a general-interest subject matter or service.' },
  { name: 'MAGAZINES_AND_NEWSPAPERS', description: 'Apps with journalistic content that is traditionally offered in printed form and which provide additional interactivity.' },
  { name: 'MEDICAL', description: 'Apps focused on medical education, information, or health reference for patients or healthcare professionals.' },
  { name: 'MUSIC', description: 'Apps that are for discovering, listening, recording, performing, or composing music.' },
  { name: 'NAVIGATION', description: 'Apps that provide information to help a user get to a physical location.' },
  { name: 'NEWS', description: 'Apps that provide information about current events and/or developments in areas of interest such as politics, entertainment, business, science, technology, and other areas.' },
  { name: 'PHOTO_AND_VIDEO', description: 'Apps that assist in capturing, editing, managing, storing, or sharing photos and videos.' },
  { name: 'PRODUCTIVITY', description: 'Apps that make a specific process or task more organized or efficient.' },
  { name: 'REFERENCE', description: 'Apps that assist the user in accessing or retrieving general information.' },
  { name: 'SHOPPING', description: 'Apps that provide a means to purchase goods or services.' },
  { name: 'SOCIAL_NETWORKING', description: 'Apps that connect people through text, voice, photo, or video.' },
  { name: 'SPORTS', description: 'Apps related to professional, amateur, collegiate, or recreational sporting activities.' },
  { name: 'STICKERS', description: [
    <MD.p>Apps that provide extended visual functionality to messaging apps.</MD.p>,
    <MD.p>This category can have up to 2 subcategories.</MD.p>,
    <MD.p><MetadataSubcategories>{['STICKERS_ANIMALS', 'STICKERS_ART', 'STICKERS_CELEBRATIONS', 'STICKERS_CELEBRITIES', 'STICKERS_CHARACTERS', 'STICKERS_EATING_AND_DRINKING', 'STICKERS_EMOJI_AND_EXPRESSIONS', 'STICKERS_FASHION', 'STICKERS_GAMING', 'STICKERS_KIDS_AND_FAMILY', 'STICKERS_MOVIES_AND_TV', 'STICKERS_MUSIC', 'STICKERS_PEOPLE', 'STICKERS_PLACES_AND_OBJECTS', 'STICKERS_SPORTS_AND_ACTIVITIES']}</MetadataSubcategories></MD.p>,
  ]},
  { name: 'TRAVEL', description: 'Apps that assist the user with any aspect of travel, such as planning, purchasing, or tracking.' },
  { name: 'UTILITIES', description: 'Apps that enable the user to solve a problem or complete a specific task.' },
  { name: 'WEATHER', description: 'Apps with specific weather-related information.' },
]}
</MetadataTable>

### Apple info

The App Store is a global service used by many people in different languages.
You can localize your App Store presence in [multiple languages](#apple-info-languages).

<Collapsible summary="Minimal localized info in English (U.S.)">
  <CodeBlocksTable tabs={['store.config.json']} style={{ marginTop: 0 }}>

```json
{
  "configVersion": 0,
  "apple": {
    "info": {
      "en-US": {
        "title": "Awesome app",
        "privacyPolicyUrl": "https://example.com/en/privacy"
      }
    }
  }
}
```

  </CodeBlocksTable>
</Collapsible>

<Collapsible summary="Complete localized info written in English (U.S.)">
  <CodeBlocksTable tabs={['store.config.json']} style={{ marginTop: 0 }}>

```json
{
  "configVersion": 0,
  "apple": {
    "info": {
      "en-US": {
        "title": "App title",
        "subtitle": "Subtitle for your app",
        "description": "A longer description of what your app does",
        "keywords": ["keyword", "other-keyword"],
        "releaseNotes": "Bug fixes and improved stability",
        "promoText": "Short tagline for your app",
        "marketingUrl": "https://example.com/en",
        "supportUrl": "https://example.com/en/help",
        "privacyPolicyUrl": "https://example.com/en/privacy",
        "privacyChoicesUrl": "https://example.com/en/privacy/choices"
      }
    }
  }
}
```

  </CodeBlocksTable>
</Collapsible>

<MetadataTable>
{[
  { name: 'title', type: 'string', rules: ['length: 2..30'], description: [
    <MD.p>Name of the app in the store. This name should be similar to the installed app name.</MD.p>,
    <MD.p theme="warning">The name will be reviewed before it is made available on the App Store.</MD.p>,
  ]},
  { name: 'subtitle', type: 'string', rules: ['length: 30'], description: [
    <MD.p>Subtext for the app in the store. For example, "A Fun Game For Friends".</MD.p>,
    <MD.p theme="warning">The subtitle will be reviewed before it is made available on the App Store.</MD.p>,
  ]},
  { name: 'description', type: 'string', rules: ['length: 10..4000'], description: 'The main description of what the app does' },
  { name: 'keywords', type: 'string[]', rules: ['unique items', 'max length item: 100'], description: 'List of keywords to help users find the app in the App Store' },
  { name: 'releaseNotes', type: 'string', rules: ['max length: 4000'], description: 'Changes since the last public version' },
  { name: 'promoText', type: 'string', rules: ['max length: 170'], description: 'The short tagline for the app' },
  { name: 'marketingUrl', type: 'string', rules: ['max length: 255'], description: 'URL to the app marketing page' },
  { name: 'supportUrl', type: 'string', rules: ['max length: 255'], description: 'URL to the app support page' },
  { name: 'privacyPolicyText', type: 'string', description: 'Privacy policy for Apple TV' },
  { name: 'privacyPolicyUrl', type: 'string', rules: ['max length: 255'], description: [
    <MD.p>URL that links to your privacy policy.</MD.p>,
    <MD.p theme="warning">A privacy policy is required for all apps.</MD.p>,
  ]},
  { name: 'privacyChoicesUrl', type: 'string', rules: ['max length: 255'], description: 'URL where users can modify and delete the data collected from the app or decide how their data is used and shared.' }
]}
</MetadataTable>

#### Apple info languages

<MetadataTable headers={['Language', 'Language Code']}>
{[
  { name: 'Arabic', description: 'ar-SA' },
  { name: 'Catalan', description: 'ca' },
  { name: 'Chinese', description: [
    <MD.p><MD.inlineCode>zh-Hans</MD.inlineCode> (Simplified)</MD.p>,
    <MD.p><MD.inlineCode>zh-Hant</MD.inlineCode> (Traditional)</MD.p>,
  ]},
  { name: 'Croatian', description: 'hr' },
  { name: 'Czech', description: 'cs' },
  { name: 'Danish', description: 'da' },
  { name: 'Dutch', description: 'nl-NL' },
  { name: 'English', description: [
    <MD.p><MD.inlineCode>en-AU</MD.inlineCode> (Australia)</MD.p>,
    <MD.p><MD.inlineCode>en-CA</MD.inlineCode> (Canada)</MD.p>,
    <MD.p><MD.inlineCode>en-GB</MD.inlineCode> (U.K.)</MD.p>,
    <MD.p><MD.inlineCode>en-US</MD.inlineCode> (U.S.)</MD.p>,
  ]},
  { name: 'Finnish', description: 'fi' },
  { name: 'French', description: [
    <MD.p><MD.inlineCode>fr-CA</MD.inlineCode> (Canada)</MD.p>,
    <MD.p><MD.inlineCode>fr-FR</MD.inlineCode> (France)</MD.p>,
  ]},
  { name: 'German', description: 'de-DE' },
  { name: 'Greek', description: 'el' },
  { name: 'Hebrew', description: 'he' },
  { name: 'Hindi', description: 'hi' },
  { name: 'Hungarian', description: 'hu' },
  { name: 'Indonesian', description: 'id' },
  { name: 'Italian', description: 'it' },
  { name: 'Japanese', description: 'ja' },
  { name: 'Korean', description: 'ko' },
  { name: 'Malay', description: 'ms' },
  { name: 'Norwegian', description: 'no' },
  { name: 'Polish', description: 'pl' },
  { name: 'Portuguese', description: [
    <MD.p><MD.inlineCode>pt-BR</MD.inlineCode> (Brazil)</MD.p>,
    <MD.p><MD.inlineCode>pt-PT</MD.inlineCode> (Portugal)</MD.p>,
  ]},
  { name: 'Romanian', description: 'ro' },
  { name: 'Russian', description: 'ru' },
  { name: 'Slovak', description: 'sk' },
  { name: 'Spanish', description: [
    <MD.p><MD.inlineCode>es-MX</MD.inlineCode> (Mexico)</MD.p>,
    <MD.p><MD.inlineCode>es-ES</MD.inlineCode> (Spain)</MD.p>,
  ]},
  { name: 'Swedish', description: 'sv' },
  { name: 'Thai', description: 'th' },
  { name: 'Turkish', description: 'tr' },
  { name: 'Ukrainian', description: 'uk' },
  { name: 'Vietnamese', description: 'vi' },
]}
</MetadataTable>

### Apple release

There are multiple strategies to put the app in the hands of your users.
You can release the app automatically after store approval or gradually release an update to your users.

<Collapsible summary="Automatic release after 25th of December, 2022 (UTC)">
  <CodeBlocksTable tabs={['store.config.json']} style={{ marginTop: 0 }}>

```json
{
  "configVersion": 0,
  "apple": {
    "release": {
      "automaticRelease": "2022-12-25T00:00:00+00:00"
    }
  }
}
```

  </CodeBlocksTable>
</Collapsible>

<MetadataTable>
{[
  {
    name: 'automaticRelease',
    type: 'boolean|Date',
    description: [
      <MD.p>If and how the app should automatically be released after approval from the App Store.</MD.p>,
      <MD.ul>
        <MD.li><MD.inlineCode>false</MD.inlineCode> - Manually release the app after store approval. (default behavior)</MD.li>
        <MD.li><MD.inlineCode>true</MD.inlineCode> - Automatically release after store approval.</MD.li>
        <MD.li><MD.inlineCode>Date</MD.inlineCode> - Automatically schedule release on this date after store approval. (using the <MD.a openInNewTab href="https://www.rfc-editor.org/rfc/rfc3339">RFC 3339</MD.a> format)</MD.li>
      </MD.ul>,
      <MD.p>Apple does not guarantee that your app is available at the chosen scheduled release date.</MD.p>,
    ],
  },
  {
    name: 'phasedRelease',
    type: 'boolean',
    description: [
      <MD.p>Phased release for automatic updates lets you gradually release this update over a 7-day period to users who have turned on automatic updates.</MD.p>,
      <MD.p>Keep in mind that this version will still be available to all users as a manual update from the App Store.</MD.p>,
      <MD.p>You can pause the phased release for up to 30 days or release this update to all users at any time.</MD.p>,
      <MD.p><MD.a openInNewTab href="https://help.apple.com/app-store-connect/#/dev3d65fcee1">Learn more</MD.a></MD.p>,
    ],
  }
]}
</MetadataTable>

### Apple review

Before publishing the app on the App Store, store approval is required.
The App Store review team must have all the information to test your app, or you risk an app rejection.

<Collapsible summary="Minimal review information">
  <CodeBlocksTable tabs={['store.config.json']} style={{ marginTop: 0 }}>

```json
{
  "configVersion": 0,
  "apple": {
    "review": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1 123 456 7890"
    }
  }
}
```

  </CodeBlocksTable>
</Collapsible>

<Collapsible summary="Complete review information">
  <CodeBlocksTable tabs={['store.config.json']} style={{ marginTop: 0 }}>

```json
{
  "configVersion": 0,
  "apple": {
    "review": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1 123 456 7890",
      "demoUsername": "john",
      "demoPassword": "applereview",
      "demoRequired": false,
      "notes": "This is an example app primarily used for educational purposes.",
    }
  }
}
```

  </CodeBlocksTable>
</Collapsible>

<MetadataTable>
{[
  { name: 'firstName', type: 'string', rules: ['min length: 1'], description: 'The app contact\'s first name in case communication is needed with the App Store review team is needed.' },
  { name: 'lastName', type: 'string', rules: ['min length: 1'], description: 'The app contact\'s last name in case communication is needed with the App Store review team is needed.' },
  { name: 'email', type: 'string', rules: ['email'], description: 'Email contact address in case communication is needed with the App Store review team.' },
  { name: 'phone', type: 'string', description: [
    <MD.p>Contact phone number in case communication is needed with the App Store review team.</MD.p>,
    <MD.p>Preface the phone number with "+" followed by the country code. (for example, +44 844 209 0611)</MD.p>,
  ]},
  { name: 'demoUsername', type: 'string', description: 'The user name to sign in to your app to review its features.' },
  { name: 'demoPassword', type: 'string', description: 'The password to sign in to your app to review its features.' },
  { name: 'demoRequired', type: 'boolean', description: [
    <MD.p>A Boolean value indicates if sign-in information is required to review your app's features.</MD.p>,
    <MD.p>If users sign in using social media, provide information for an account for review.</MD.p>,
    <MD.p theme="warning">Credentials must be valid and active for the duration of the review.</MD.p>,
  ]},
  { name: 'notes', type: 'string', rules: ['length: 2..4000'], description: [
    <MD.p>Additional information about your app that can help during the review process.</MD.p>,
    <MD.p theme="warning">Do not include demo account details in the notes. Use the <MD.inlineCode>demoUsername</MD.inlineCode> and <MD.inlineCode>demoPassword</MD.inlineCode> properties instead.</MD.p>,
  ]},
]}
</MetadataTable>
