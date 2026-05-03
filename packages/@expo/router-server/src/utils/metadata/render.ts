import { pushLink, pushName, pushProperty } from './tag';
import type {
  MetadataTag,
  ResolvedAlternates,
  ResolvedAppLinks,
  ResolvedAppleWebApp,
  ResolvedFacebook,
  ResolvedIcons,
  ResolvedMetadata,
  ResolvedOpenGraph,
  ResolvedTwitter,
  ResolvedVerification,
} from './types';

export function renderMetadataTags(resolved: ResolvedMetadata): MetadataTag[] {
  const tags: MetadataTag[] = [];

  renderTitle(tags, resolved.title);
  renderBasicMetadata(tags, resolved);
  renderAuthors(tags, resolved.authors);
  renderCreatorMetadata(tags, resolved);
  renderRobots(tags, resolved);
  renderAlternates(tags, resolved.alternates);
  renderOpenGraph(tags, resolved.openGraph);
  renderTwitter(tags, resolved.twitter);
  renderIcons(tags, resolved.icons);
  renderFormatDetection(tags, resolved.formatDetection);
  renderVerification(tags, resolved.verification);
  renderAppleWebApp(tags, resolved.appleWebApp);
  renderItunes(tags, resolved.itunes);
  renderFacebook(tags, resolved.facebook);
  renderPinterest(tags, resolved.pinterest);
  renderAppLinks(tags, resolved.appLinks);
  renderLinkRelations(tags, resolved);
  renderOther(tags, resolved.other);

  return tags;
}

function renderTitle(tags: MetadataTag[], title: string | undefined) {
  if (!title) return;

  tags.push({
    tagName: 'title',
    content: title,
  });
}

function renderBasicMetadata(tags: MetadataTag[], resolved: ResolvedMetadata) {
  pushName(tags, 'description', resolved.description);
  pushName(tags, 'application-name', resolved.applicationName);
  pushName(tags, 'keywords', resolved.keywords);
  pushName(tags, 'generator', resolved.generator);
  pushName(tags, 'referrer', resolved.referrer);
}

function renderAuthors(tags: MetadataTag[], authors: ResolvedMetadata['authors']) {
  for (const author of authors) {
    pushName(tags, 'author', author.name);
    if (author.url) {
      pushLink(tags, { rel: 'author', href: author.url });
    }
  }
}

function renderCreatorMetadata(tags: MetadataTag[], resolved: ResolvedMetadata) {
  pushName(tags, 'creator', resolved.creator);
  pushName(tags, 'publisher', resolved.publisher);
  pushName(tags, 'category', resolved.category);
}

function renderRobots(tags: MetadataTag[], resolved: ResolvedMetadata) {
  pushName(tags, 'robots', resolved.robots);
  pushName(tags, 'googlebot', resolved.googleBot);
}

function renderAlternates(tags: MetadataTag[], alternates: ResolvedAlternates | undefined) {
  if (!alternates) return;

  if (alternates.canonical) {
    pushLink(tags, { rel: 'canonical', href: alternates.canonical });
  }

  for (const language of alternates.languages) {
    pushLink(tags, {
      rel: 'alternate',
      href: language.href,
      hreflang: language.hrefLang,
    });
  }

  for (const media of alternates.media) {
    pushLink(tags, {
      rel: 'alternate',
      href: media.href,
      media: media.media,
    });
  }

  for (const type of alternates.types) {
    pushLink(tags, {
      rel: 'alternate',
      href: type.href,
      type: type.type,
    });
  }
}

function renderOpenGraph(tags: MetadataTag[], openGraph: ResolvedOpenGraph | undefined) {
  if (!openGraph) return;

  for (const field of openGraph.basic) {
    pushProperty(tags, field.property, field.content);
  }

  for (const image of openGraph.images) {
    pushProperty(tags, 'og:image', image.url);
    pushProperty(tags, 'og:image:alt', image.alt);
    pushProperty(tags, 'og:image:width', image.width);
    pushProperty(tags, 'og:image:height', image.height);
    pushProperty(tags, 'og:image:type', image.type);
    pushProperty(tags, 'og:image:secure_url', image.secureUrl);
  }

  for (const video of openGraph.videos) {
    pushProperty(tags, 'og:video', video.url);
    pushProperty(tags, 'og:video:secure_url', video.secureUrl);
    pushProperty(tags, 'og:video:type', video.type);
    pushProperty(tags, 'og:video:width', video.width);
    pushProperty(tags, 'og:video:height', video.height);
  }

  for (const audio of openGraph.audio) {
    pushProperty(tags, 'og:audio', audio.url);
    pushProperty(tags, 'og:audio:secure_url', audio.secureUrl);
    pushProperty(tags, 'og:audio:type', audio.type);
  }

  for (const field of openGraph.article) {
    pushProperty(tags, field.property, field.content);
  }
}

function renderTwitter(tags: MetadataTag[], twitter: ResolvedTwitter | undefined) {
  if (!twitter) return;

  for (const field of twitter.basic) {
    pushName(tags, field.name, field.content);
  }

  for (const image of twitter.images) {
    pushName(tags, 'twitter:image', image.url);
    pushName(tags, 'twitter:image:alt', image.alt);
  }

  for (const player of twitter.players) {
    pushName(tags, 'twitter:player', player.url);
    pushName(tags, 'twitter:player:width', player.width);
    pushName(tags, 'twitter:player:height', player.height);
    pushName(tags, 'twitter:player:stream', player.stream);
  }

  for (const app of twitter.app) {
    pushName(tags, `twitter:app:name:${app.platform}`, app.name);
    pushName(tags, `twitter:app:id:${app.platform}`, app.id);
    pushName(tags, `twitter:app:url:${app.platform}`, app.url);
  }
}

function renderIcons(tags: MetadataTag[], icons: ResolvedIcons | undefined) {
  if (!icons) return;

  for (const icon of icons.icon) {
    pushLink(tags, icon);
  }
  for (const shortcut of icons.shortcut) {
    pushLink(tags, shortcut);
  }
  for (const apple of icons.apple) {
    pushLink(tags, apple);
  }
  for (const other of icons.other) {
    pushLink(tags, other);
  }
}

function renderFormatDetection(tags: MetadataTag[], formatDetection: string | undefined) {
  pushName(tags, 'format-detection', formatDetection);
}

function renderVerification(tags: MetadataTag[], verification: ResolvedVerification | undefined) {
  if (!verification) return;

  for (const content of verification.google) {
    pushName(tags, 'google-site-verification', content);
  }
  for (const content of verification.yahoo) {
    pushName(tags, 'y_key', content);
  }
  for (const content of verification.yandex) {
    pushName(tags, 'yandex-verification', content);
  }
  for (const entry of verification.other) {
    pushName(tags, entry.name, entry.content);
  }
}

function renderAppleWebApp(tags: MetadataTag[], appleWebApp: ResolvedAppleWebApp | undefined) {
  if (!appleWebApp) return;

  pushName(tags, 'mobile-web-app-capable', appleWebApp.capable);
  pushName(tags, 'apple-mobile-web-app-title', appleWebApp.title);
  pushName(tags, 'apple-mobile-web-app-status-bar-style', appleWebApp.statusBarStyle);

  for (const image of appleWebApp.startupImages) {
    pushLink(tags, {
      rel: 'apple-touch-startup-image',
      href: image.href,
      media: image.media,
    });
  }
}

function renderItunes(tags: MetadataTag[], itunes: string | undefined) {
  pushName(tags, 'apple-itunes-app', itunes);
}

function renderFacebook(tags: MetadataTag[], facebook: ResolvedFacebook | undefined) {
  if (!facebook) return;

  pushProperty(tags, 'fb:app_id', facebook.appId);
  for (const admin of facebook.admins) {
    pushProperty(tags, 'fb:admins', admin);
  }
}

function renderPinterest(tags: MetadataTag[], pinterest: 'true' | 'false' | undefined) {
  pushName(tags, 'pinterest-rich-pin', pinterest);
}

function renderAppLinks(tags: MetadataTag[], appLinks: ResolvedAppLinks | undefined) {
  if (!appLinks) return;

  if (appLinks.ios) {
    pushProperty(tags, 'al:ios:url', appLinks.ios.url);
    pushProperty(tags, 'al:ios:app_store_id', appLinks.ios.appStoreId);
    pushProperty(tags, 'al:ios:app_name', appLinks.ios.appName);
  }

  if (appLinks.android) {
    pushProperty(tags, 'al:android:url', appLinks.android.url);
    pushProperty(tags, 'al:android:package', appLinks.android.package);
    pushProperty(tags, 'al:android:app_name', appLinks.android.appName);
  }

  if (appLinks.web) {
    pushProperty(tags, 'al:web:url', appLinks.web.url);
    pushProperty(tags, 'al:web:should_fallback', appLinks.web.shouldFallback);
  }
}

function renderLinkRelations(tags: MetadataTag[], resolved: ResolvedMetadata) {
  renderLinkArray(tags, 'archives', resolved.archives);
  renderLinkArray(tags, 'assets', resolved.assets);
  renderLinkArray(tags, 'bookmarks', resolved.bookmarks);
  renderManifest(tags, resolved.manifest);
}

function renderLinkArray(tags: MetadataTag[], rel: string, urls: string[]) {
  for (const url of urls) {
    pushLink(tags, { rel, href: url });
  }
}

function renderManifest(tags: MetadataTag[], manifest: string | undefined) {
  if (!manifest) return;
  pushLink(tags, { rel: 'manifest', href: manifest });
}

function renderOther(tags: MetadataTag[], other: { name: string; content: string }[]) {
  for (const entry of other) {
    pushName(tags, entry.name, entry.content);
  }
}
