/**
 * When the user installs your app that contains associated domains, the
 * system fetches the corresponding Apple App Site Association (AASA) file
 * from an Apple-managed content delivery network (CDN) and uses its JSON
 * contents to verify those associated domains. If the CDN doesn’t store a
 * copy of that file, or has an outdated version, it automatically connects
 * to your server and retrieves the latest version.
 *
 * After you define your app’s associated domains in Xcode, you must
 * create this file and serve it using HTTPS from your website’s `.well-known` directory.
 * For more information, see [Add the associated domain file to your website](https://developer.apple.com/documentation/xcode/supporting-associated-domains#Add-the-associated-domain-file-to-your-website).
 */
export interface AppSiteAssociation {
  /**
   * If your domain supports universal links, see [Supporting Universal Links in Your App](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app) for more information.
   */
  applinks?: Applinks;
  /**
   * If your domain supports shared web credentials, see [Managing Shared Credentials](https://developer.apple.com/documentation/security/shared_web_credentials/managing_shared_credentials) for more information.
   */
  webcredentials?: AppSiteAssociationCategory;
  /**
   * If your domain supports Handoff, see [Web Browser-to-Native App Handoff](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/Handoff/AdoptingHandoff/AdoptingHandoff.html#//apple_ref/doc/uid/TP40014338-CH2-SW10) for more information.
   */
  activitycontinuation?: AppSiteAssociationCategory;
  /**
   * If your domain supports App Clips, see [Associating your App Clip with your website](https://developer.apple.com/documentation/app_clips/associating_your_app_clip_with_your_website) for more information.
   */
  appclips?: AppSiteAssociationCategory;
}

/** App ID is formatted as `<Opaque Apple Team ID>.<Bundle Identifier>` */
type AppID = string;

export interface AppSiteAssociationCategory {
  apps: AppID[];
}

export interface Applinks {
  apps?: AppID[];
  defaults?: Partial<Component>;
  substitutionVariables?: Record<string, string[]>;
  details?: Detail[];
}

export interface Detail {
  /** App ID is formatted as `<Opaque Apple Team ID>.<Bundle Identifier>` */
  appIDs: AppID[];
  appID?: AppID;
  components: Component[];
}

export interface Component {
  /** Matcher */
  '/': string;
  /** Comment */
  comment?: string;
  /** Exclude the matched route */
  exclude?: boolean;
  /** Should matches be case sensitive. Default `false` (I think) */
  caseSensitive?: boolean;
  /** Match query parameters */
  '?'?: Record<string, string>;
  '#'?: string;
}
