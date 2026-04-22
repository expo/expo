"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeMetadataToTags = serializeMetadataToTags;
exports.serializeMetadataToHtml = serializeMetadataToHtml;
function escapeHtmlAttribute(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function escapeHtmlText(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderMetadataTag(tag) {
    const attributes = tag.attributes
        ? ' ' +
            Object.entries(tag.attributes)
                .filter(([, value]) => value != null && value !== '')
                .map(([key, value]) => `${key}="${escapeHtmlAttribute(value)}"`)
                .join(' ')
        : '';
    if (tag.tagName === 'title') {
        return `<title>${escapeHtmlText(tag.content ?? '')}</title>`;
    }
    return `<${tag.tagName}${attributes}>`;
}
function pushMetaContent(tags, name, key, value) {
    if (!value)
        return;
    tags.push({
        tagName: 'meta',
        attributes: {
            [name]: key,
            content: value,
        },
    });
}
function toCommaSeparatedValue(value) {
    if (!value)
        return undefined;
    return Array.isArray(value) ? value.join(', ') : value;
}
function serializeRobotsValue(robots) {
    if (!robots)
        return undefined;
    if (typeof robots === 'string')
        return robots;
    const values = [];
    for (const [key, value] of Object.entries(robots)) {
        if (key === 'googleBot' || value == null || typeof value === 'object')
            continue;
        if (typeof value === 'boolean') {
            values.push(value ? key : `no${key}`);
        }
        else {
            values.push(`${key}:${String(value)}`);
        }
    }
    return values.join(', ');
}
function normalizeMetadataImages(images) {
    if (!images)
        return [];
    return Array.isArray(images) ? images : [images];
}
function normalizeArray(items) {
    if (!items)
        return [];
    return Array.isArray(items) ? items : [items];
}
function serializeOpenGraph(tags, openGraph) {
    if (!openGraph)
        return;
    pushMetaContent(tags, 'property', 'og:title', openGraph.title);
    pushMetaContent(tags, 'property', 'og:description', openGraph.description);
    pushMetaContent(tags, 'property', 'og:url', openGraph.url);
    pushMetaContent(tags, 'property', 'og:site_name', openGraph.siteName);
    pushMetaContent(tags, 'property', 'og:locale', openGraph.locale);
    pushMetaContent(tags, 'property', 'og:type', openGraph.type);
    pushMetaContent(tags, 'property', 'og:determiner', openGraph.determiner || undefined);
    pushMetaContent(tags, 'property', 'og:country_name', openGraph.countryName);
    pushMetaContent(tags, 'property', 'og:ttl', openGraph.ttl != null ? String(openGraph.ttl) : undefined);
    if (openGraph.alternateLocale) {
        for (const locale of openGraph.alternateLocale) {
            pushMetaContent(tags, 'property', 'og:locale:alternate', locale);
        }
    }
    if (openGraph.emails) {
        for (const email of openGraph.emails) {
            pushMetaContent(tags, 'property', 'og:email', email);
        }
    }
    if (openGraph.phoneNumbers) {
        for (const phone of openGraph.phoneNumbers) {
            pushMetaContent(tags, 'property', 'og:phone_number', phone);
        }
    }
    if (openGraph.faxNumbers) {
        for (const fax of openGraph.faxNumbers) {
            pushMetaContent(tags, 'property', 'og:fax_number', fax);
        }
    }
    for (const image of normalizeMetadataImages(openGraph.images)) {
        if (typeof image === 'string') {
            pushMetaContent(tags, 'property', 'og:image', image);
            continue;
        }
        pushMetaContent(tags, 'property', 'og:image', image.url);
        pushMetaContent(tags, 'property', 'og:image:alt', image.alt);
        pushMetaContent(tags, 'property', 'og:image:width', image.width != null ? String(image.width) : undefined);
        pushMetaContent(tags, 'property', 'og:image:height', image.height != null ? String(image.height) : undefined);
        pushMetaContent(tags, 'property', 'og:image:type', image.type);
        pushMetaContent(tags, 'property', 'og:image:secure_url', image.secureUrl);
    }
    for (const video of normalizeArray(openGraph.videos)) {
        if (typeof video === 'string') {
            pushMetaContent(tags, 'property', 'og:video', video);
            continue;
        }
        pushMetaContent(tags, 'property', 'og:video', video.url);
        pushMetaContent(tags, 'property', 'og:video:secure_url', video.secureUrl);
        pushMetaContent(tags, 'property', 'og:video:type', video.type);
        pushMetaContent(tags, 'property', 'og:video:width', video.width != null ? String(video.width) : undefined);
        pushMetaContent(tags, 'property', 'og:video:height', video.height != null ? String(video.height) : undefined);
    }
    for (const audio of normalizeArray(openGraph.audio)) {
        if (typeof audio === 'string') {
            pushMetaContent(tags, 'property', 'og:audio', audio);
            continue;
        }
        pushMetaContent(tags, 'property', 'og:audio', audio.url);
        pushMetaContent(tags, 'property', 'og:audio:secure_url', audio.secureUrl);
        pushMetaContent(tags, 'property', 'og:audio:type', audio.type);
    }
    // Article-specific fields
    pushMetaContent(tags, 'property', 'article:published_time', openGraph.publishedTime);
    pushMetaContent(tags, 'property', 'article:modified_time', openGraph.modifiedTime);
    pushMetaContent(tags, 'property', 'article:expiration_time', openGraph.expirationTime);
    pushMetaContent(tags, 'property', 'article:section', openGraph.section);
    if (openGraph.tags) {
        for (const tag of openGraph.tags) {
            pushMetaContent(tags, 'property', 'article:tag', tag);
        }
    }
    if (openGraph.authors) {
        for (const author of openGraph.authors) {
            pushMetaContent(tags, 'property', 'article:author', author);
        }
    }
}
function serializeTwitter(tags, twitter) {
    if (!twitter)
        return;
    pushMetaContent(tags, 'name', 'twitter:card', twitter.card);
    pushMetaContent(tags, 'name', 'twitter:title', twitter.title);
    pushMetaContent(tags, 'name', 'twitter:description', twitter.description);
    pushMetaContent(tags, 'name', 'twitter:site', twitter.site);
    pushMetaContent(tags, 'name', 'twitter:site:id', twitter.siteId);
    pushMetaContent(tags, 'name', 'twitter:creator', twitter.creator);
    pushMetaContent(tags, 'name', 'twitter:creator:id', twitter.creatorId);
    for (const image of normalizeArray(twitter.images)) {
        if (typeof image === 'string') {
            pushMetaContent(tags, 'name', 'twitter:image', image);
        }
        else {
            pushMetaContent(tags, 'name', 'twitter:image', image.url);
            pushMetaContent(tags, 'name', 'twitter:image:alt', image.alt);
        }
    }
    for (const player of normalizeArray(twitter.players)) {
        pushMetaContent(tags, 'name', 'twitter:player', player.url);
        pushMetaContent(tags, 'name', 'twitter:player:width', player.width != null ? String(player.width) : undefined);
        pushMetaContent(tags, 'name', 'twitter:player:height', player.height != null ? String(player.height) : undefined);
        pushMetaContent(tags, 'name', 'twitter:player:stream', player.stream);
    }
    if (twitter.app) {
        const { app } = twitter;
        for (const platform of ['iphone', 'ipad', 'googleplay']) {
            if (app.name) {
                pushMetaContent(tags, 'name', `twitter:app:name:${platform}`, app.name);
            }
            pushMetaContent(tags, 'name', `twitter:app:id:${platform}`, app.id?.[platform]);
            pushMetaContent(tags, 'name', `twitter:app:url:${platform}`, app.url?.[platform]);
        }
    }
}
function pushAlternateLinks(tags, rel, values, attributeName) {
    if (!values)
        return;
    for (const [key, href] of Object.entries(values)) {
        if (!href)
            continue;
        tags.push({
            tagName: 'link',
            attributes: {
                rel,
                href,
                [attributeName]: key,
            },
        });
    }
}
function serializeAlternates(tags, alternates) {
    if (!alternates)
        return;
    if (alternates.canonical) {
        tags.push({
            tagName: 'link',
            attributes: {
                rel: 'canonical',
                href: alternates.canonical,
            },
        });
    }
    pushAlternateLinks(tags, 'alternate', alternates.languages, 'hreflang');
    pushAlternateLinks(tags, 'alternate', alternates.media, 'media');
    pushAlternateLinks(tags, 'alternate', alternates.types, 'type');
}
function normalizeIconDescriptor(rel, descriptor) {
    if (typeof descriptor === 'string') {
        return { rel, href: descriptor };
    }
    if (!descriptor.url) {
        return null;
    }
    return {
        rel: descriptor.rel ?? rel,
        href: descriptor.url,
        ...(descriptor.type ? { type: descriptor.type } : {}),
        ...(descriptor.sizes ? { sizes: descriptor.sizes } : {}),
        ...(descriptor.media ? { media: descriptor.media } : {}),
    };
}
function pushIcons(tags, rel, descriptors) {
    if (!descriptors)
        return;
    const items = Array.isArray(descriptors) ? descriptors : [descriptors];
    for (const descriptor of items) {
        const attributes = normalizeIconDescriptor(rel, descriptor);
        if (!attributes)
            continue;
        tags.push({
            tagName: 'link',
            attributes,
        });
    }
}
function serializeIcons(tags, icons) {
    if (!icons)
        return;
    pushIcons(tags, 'icon', icons.icon);
    pushIcons(tags, 'shortcut icon', icons.shortcut);
    pushIcons(tags, 'apple-touch-icon', icons.apple);
    pushIcons(tags, 'icon', icons.other);
}
function serializeFormatDetection(tags, formatDetection) {
    if (!formatDetection)
        return;
    const parts = [];
    if (formatDetection.telephone != null)
        parts.push(`telephone=${formatDetection.telephone ? 'yes' : 'no'}`);
    if (formatDetection.date != null)
        parts.push(`date=${formatDetection.date ? 'yes' : 'no'}`);
    if (formatDetection.address != null)
        parts.push(`address=${formatDetection.address ? 'yes' : 'no'}`);
    if (formatDetection.email != null)
        parts.push(`email=${formatDetection.email ? 'yes' : 'no'}`);
    if (formatDetection.url != null)
        parts.push(`url=${formatDetection.url ? 'yes' : 'no'}`);
    if (parts.length > 0) {
        pushMetaContent(tags, 'name', 'format-detection', parts.join(', '));
    }
}
function serializeVerification(tags, verification) {
    if (!verification)
        return;
    const pushValues = (key, value) => {
        if (!value)
            return;
        const values = Array.isArray(value) ? value : [value];
        for (const v of values) {
            pushMetaContent(tags, 'name', key, v);
        }
    };
    pushValues('google-site-verification', verification.google);
    pushValues('y_key', verification.yahoo);
    pushValues('yandex-verification', verification.yandex);
    if (verification.other) {
        for (const [key, value] of Object.entries(verification.other)) {
            pushValues(key, value);
        }
    }
}
function serializeAppleWebApp(tags, appleWebApp) {
    if (!appleWebApp)
        return;
    if (appleWebApp.capable != null) {
        pushMetaContent(tags, 'name', 'apple-mobile-web-app-capable', appleWebApp.capable ? 'yes' : 'no');
    }
    pushMetaContent(tags, 'name', 'apple-mobile-web-app-title', appleWebApp.title);
    pushMetaContent(tags, 'name', 'apple-mobile-web-app-status-bar-style', appleWebApp.statusBarStyle);
    if (appleWebApp.startupImage) {
        const images = Array.isArray(appleWebApp.startupImage)
            ? appleWebApp.startupImage
            : [appleWebApp.startupImage];
        for (const image of images) {
            tags.push({
                tagName: 'link',
                attributes: { rel: 'apple-touch-startup-image', href: image },
            });
        }
    }
}
function serializeItunes(tags, itunes) {
    if (!itunes)
        return;
    const parts = [`app-id=${itunes.appId}`];
    if (itunes.affiliateData)
        parts.push(`affiliate-data=${itunes.affiliateData}`);
    if (itunes.appArgument)
        parts.push(`app-argument=${itunes.appArgument}`);
    pushMetaContent(tags, 'name', 'apple-itunes-app', parts.join(', '));
}
function serializeFacebook(tags, facebook) {
    if (!facebook)
        return;
    pushMetaContent(tags, 'property', 'fb:app_id', facebook.appId);
    if (facebook.admins) {
        const admins = Array.isArray(facebook.admins) ? facebook.admins : [facebook.admins];
        for (const admin of admins) {
            pushMetaContent(tags, 'property', 'fb:admins', admin);
        }
    }
}
function serializePinterest(tags, pinterest) {
    if (!pinterest)
        return;
    if (pinterest.richPin != null) {
        pushMetaContent(tags, 'name', 'pinterest-rich-pin', pinterest.richPin ? 'true' : 'false');
    }
}
function serializeAppLinks(tags, appLinks) {
    if (!appLinks)
        return;
    if (appLinks.ios) {
        pushMetaContent(tags, 'property', 'al:ios:url', appLinks.ios.url);
        pushMetaContent(tags, 'property', 'al:ios:app_store_id', appLinks.ios.appStoreId);
        pushMetaContent(tags, 'property', 'al:ios:app_name', appLinks.ios.appName);
    }
    if (appLinks.android) {
        pushMetaContent(tags, 'property', 'al:android:url', appLinks.android.url);
        pushMetaContent(tags, 'property', 'al:android:package', appLinks.android.package);
        pushMetaContent(tags, 'property', 'al:android:app_name', appLinks.android.appName);
    }
    if (appLinks.web) {
        pushMetaContent(tags, 'property', 'al:web:url', appLinks.web.url);
        if (appLinks.web.shouldFallback != null) {
            pushMetaContent(tags, 'property', 'al:web:should_fallback', appLinks.web.shouldFallback ? 'true' : 'false');
        }
    }
}
function pushLinkArray(tags, rel, urls) {
    if (!urls)
        return;
    for (const url of urls) {
        tags.push({ tagName: 'link', attributes: { rel, href: url } });
    }
}
function normalizeOtherValue(value) {
    if (value == null)
        return [];
    const values = Array.isArray(value) ? value : [value];
    return values.map((entry) => String(entry));
}
function serializeOther(tags, other) {
    if (!other)
        return;
    for (const [key, value] of Object.entries(other)) {
        for (const normalizedValue of normalizeOtherValue(value)) {
            pushMetaContent(tags, 'name', key, normalizedValue);
        }
    }
}
function serializeAuthors(tags, authors) {
    if (!authors)
        return;
    const items = Array.isArray(authors) ? authors : [authors];
    for (const author of items) {
        pushMetaContent(tags, 'name', 'author', author.name);
        if (author.url) {
            tags.push({ tagName: 'link', attributes: { rel: 'author', href: author.url } });
        }
    }
}
function serializeMetadataToTags(metadata) {
    const tags = [];
    if (metadata.title) {
        tags.push({
            tagName: 'title',
            content: metadata.title,
        });
    }
    pushMetaContent(tags, 'name', 'description', metadata.description);
    pushMetaContent(tags, 'name', 'application-name', metadata.applicationName);
    pushMetaContent(tags, 'name', 'keywords', toCommaSeparatedValue(metadata.keywords));
    pushMetaContent(tags, 'name', 'generator', metadata.generator);
    pushMetaContent(tags, 'name', 'referrer', metadata.referrer);
    serializeAuthors(tags, metadata.authors);
    pushMetaContent(tags, 'name', 'creator', metadata.creator);
    pushMetaContent(tags, 'name', 'publisher', metadata.publisher);
    pushMetaContent(tags, 'name', 'category', metadata.category);
    pushMetaContent(tags, 'name', 'robots', serializeRobotsValue(metadata.robots));
    if (typeof metadata.robots === 'object' && metadata.robots.googleBot) {
        pushMetaContent(tags, 'name', 'googlebot', serializeRobotsValue(metadata.robots.googleBot));
    }
    serializeAlternates(tags, metadata.alternates);
    serializeOpenGraph(tags, metadata.openGraph);
    serializeTwitter(tags, metadata.twitter);
    serializeIcons(tags, metadata.icons);
    serializeFormatDetection(tags, metadata.formatDetection);
    serializeVerification(tags, metadata.verification);
    serializeAppleWebApp(tags, metadata.appleWebApp);
    serializeItunes(tags, metadata.itunes);
    serializeFacebook(tags, metadata.facebook);
    serializePinterest(tags, metadata.pinterest);
    serializeAppLinks(tags, metadata.appLinks);
    pushLinkArray(tags, 'archives', metadata.archives);
    pushLinkArray(tags, 'assets', metadata.assets);
    pushLinkArray(tags, 'bookmarks', metadata.bookmarks);
    if (metadata.manifest) {
        tags.push({ tagName: 'link', attributes: { rel: 'manifest', href: metadata.manifest } });
    }
    serializeOther(tags, metadata.other);
    return tags;
}
function serializeMetadataToHtml(metadata) {
    return serializeMetadataToTags(metadata).map(renderMetadataTag).join('');
}
//# sourceMappingURL=metadata.js.map