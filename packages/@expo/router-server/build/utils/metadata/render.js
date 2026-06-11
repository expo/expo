"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMetadataTags = renderMetadataTags;
const tag_1 = require("./tag");
function renderMetadataTags(resolved) {
    const tags = [];
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
function renderTitle(tags, title) {
    if (!title)
        return;
    tags.push({
        tagName: 'title',
        content: title,
    });
}
function renderBasicMetadata(tags, resolved) {
    (0, tag_1.pushName)(tags, 'description', resolved.description);
    (0, tag_1.pushName)(tags, 'application-name', resolved.applicationName);
    (0, tag_1.pushName)(tags, 'keywords', resolved.keywords);
    (0, tag_1.pushName)(tags, 'generator', resolved.generator);
    (0, tag_1.pushName)(tags, 'referrer', resolved.referrer);
}
function renderAuthors(tags, authors) {
    for (const author of authors) {
        (0, tag_1.pushName)(tags, 'author', author.name);
        if (author.url) {
            (0, tag_1.pushLink)(tags, { rel: 'author', href: author.url });
        }
    }
}
function renderCreatorMetadata(tags, resolved) {
    (0, tag_1.pushName)(tags, 'creator', resolved.creator);
    (0, tag_1.pushName)(tags, 'publisher', resolved.publisher);
    (0, tag_1.pushName)(tags, 'category', resolved.category);
}
function renderRobots(tags, resolved) {
    (0, tag_1.pushName)(tags, 'robots', resolved.robots);
    (0, tag_1.pushName)(tags, 'googlebot', resolved.googleBot);
}
function renderAlternates(tags, alternates) {
    if (!alternates)
        return;
    if (alternates.canonical) {
        (0, tag_1.pushLink)(tags, { rel: 'canonical', href: alternates.canonical });
    }
    for (const language of alternates.languages) {
        (0, tag_1.pushLink)(tags, {
            rel: 'alternate',
            href: language.href,
            hreflang: language.hrefLang,
        });
    }
    for (const media of alternates.media) {
        (0, tag_1.pushLink)(tags, {
            rel: 'alternate',
            href: media.href,
            media: media.media,
        });
    }
    for (const type of alternates.types) {
        (0, tag_1.pushLink)(tags, {
            rel: 'alternate',
            href: type.href,
            type: type.type,
        });
    }
}
function renderOpenGraph(tags, openGraph) {
    if (!openGraph)
        return;
    for (const field of openGraph.basic) {
        (0, tag_1.pushProperty)(tags, field.property, field.content);
    }
    for (const image of openGraph.images) {
        (0, tag_1.pushProperty)(tags, 'og:image', image.url);
        (0, tag_1.pushProperty)(tags, 'og:image:alt', image.alt);
        (0, tag_1.pushProperty)(tags, 'og:image:width', image.width);
        (0, tag_1.pushProperty)(tags, 'og:image:height', image.height);
        (0, tag_1.pushProperty)(tags, 'og:image:type', image.type);
        (0, tag_1.pushProperty)(tags, 'og:image:secure_url', image.secureUrl);
    }
    for (const video of openGraph.videos) {
        (0, tag_1.pushProperty)(tags, 'og:video', video.url);
        (0, tag_1.pushProperty)(tags, 'og:video:secure_url', video.secureUrl);
        (0, tag_1.pushProperty)(tags, 'og:video:type', video.type);
        (0, tag_1.pushProperty)(tags, 'og:video:width', video.width);
        (0, tag_1.pushProperty)(tags, 'og:video:height', video.height);
    }
    for (const audio of openGraph.audio) {
        (0, tag_1.pushProperty)(tags, 'og:audio', audio.url);
        (0, tag_1.pushProperty)(tags, 'og:audio:secure_url', audio.secureUrl);
        (0, tag_1.pushProperty)(tags, 'og:audio:type', audio.type);
    }
    for (const field of openGraph.article) {
        (0, tag_1.pushProperty)(tags, field.property, field.content);
    }
}
function renderTwitter(tags, twitter) {
    if (!twitter)
        return;
    for (const field of twitter.basic) {
        (0, tag_1.pushName)(tags, field.name, field.content);
    }
    for (const image of twitter.images) {
        (0, tag_1.pushName)(tags, 'twitter:image', image.url);
        (0, tag_1.pushName)(tags, 'twitter:image:alt', image.alt);
    }
    for (const player of twitter.players) {
        (0, tag_1.pushName)(tags, 'twitter:player', player.url);
        (0, tag_1.pushName)(tags, 'twitter:player:width', player.width);
        (0, tag_1.pushName)(tags, 'twitter:player:height', player.height);
        (0, tag_1.pushName)(tags, 'twitter:player:stream', player.stream);
    }
    for (const app of twitter.app) {
        (0, tag_1.pushName)(tags, `twitter:app:name:${app.platform}`, app.name);
        (0, tag_1.pushName)(tags, `twitter:app:id:${app.platform}`, app.id);
        (0, tag_1.pushName)(tags, `twitter:app:url:${app.platform}`, app.url);
    }
}
function renderIcons(tags, icons) {
    if (!icons)
        return;
    for (const icon of icons.icon) {
        (0, tag_1.pushLink)(tags, icon);
    }
    for (const shortcut of icons.shortcut) {
        (0, tag_1.pushLink)(tags, shortcut);
    }
    for (const apple of icons.apple) {
        (0, tag_1.pushLink)(tags, apple);
    }
    for (const other of icons.other) {
        (0, tag_1.pushLink)(tags, other);
    }
}
function renderFormatDetection(tags, formatDetection) {
    (0, tag_1.pushName)(tags, 'format-detection', formatDetection);
}
function renderVerification(tags, verification) {
    if (!verification)
        return;
    for (const content of verification.google) {
        (0, tag_1.pushName)(tags, 'google-site-verification', content);
    }
    for (const content of verification.yahoo) {
        (0, tag_1.pushName)(tags, 'y_key', content);
    }
    for (const content of verification.yandex) {
        (0, tag_1.pushName)(tags, 'yandex-verification', content);
    }
    for (const entry of verification.other) {
        (0, tag_1.pushName)(tags, entry.name, entry.content);
    }
}
function renderAppleWebApp(tags, appleWebApp) {
    if (!appleWebApp)
        return;
    (0, tag_1.pushName)(tags, 'mobile-web-app-capable', appleWebApp.capable);
    (0, tag_1.pushName)(tags, 'apple-mobile-web-app-title', appleWebApp.title);
    (0, tag_1.pushName)(tags, 'apple-mobile-web-app-status-bar-style', appleWebApp.statusBarStyle);
    for (const image of appleWebApp.startupImages) {
        (0, tag_1.pushLink)(tags, {
            rel: 'apple-touch-startup-image',
            href: image.href,
            media: image.media,
        });
    }
}
function renderItunes(tags, itunes) {
    (0, tag_1.pushName)(tags, 'apple-itunes-app', itunes);
}
function renderFacebook(tags, facebook) {
    if (!facebook)
        return;
    (0, tag_1.pushProperty)(tags, 'fb:app_id', facebook.appId);
    for (const admin of facebook.admins) {
        (0, tag_1.pushProperty)(tags, 'fb:admins', admin);
    }
}
function renderPinterest(tags, pinterest) {
    (0, tag_1.pushName)(tags, 'pinterest-rich-pin', pinterest);
}
function renderAppLinks(tags, appLinks) {
    if (!appLinks)
        return;
    if (appLinks.ios) {
        (0, tag_1.pushProperty)(tags, 'al:ios:url', appLinks.ios.url);
        (0, tag_1.pushProperty)(tags, 'al:ios:app_store_id', appLinks.ios.appStoreId);
        (0, tag_1.pushProperty)(tags, 'al:ios:app_name', appLinks.ios.appName);
    }
    if (appLinks.android) {
        (0, tag_1.pushProperty)(tags, 'al:android:url', appLinks.android.url);
        (0, tag_1.pushProperty)(tags, 'al:android:package', appLinks.android.package);
        (0, tag_1.pushProperty)(tags, 'al:android:app_name', appLinks.android.appName);
    }
    if (appLinks.web) {
        (0, tag_1.pushProperty)(tags, 'al:web:url', appLinks.web.url);
        (0, tag_1.pushProperty)(tags, 'al:web:should_fallback', appLinks.web.shouldFallback);
    }
}
function renderLinkRelations(tags, resolved) {
    renderLinkArray(tags, 'archives', resolved.archives);
    renderLinkArray(tags, 'assets', resolved.assets);
    renderLinkArray(tags, 'bookmarks', resolved.bookmarks);
    renderManifest(tags, resolved.manifest);
}
function renderLinkArray(tags, rel, urls) {
    for (const url of urls) {
        (0, tag_1.pushLink)(tags, { rel, href: url });
    }
}
function renderManifest(tags, manifest) {
    if (!manifest)
        return;
    (0, tag_1.pushLink)(tags, { rel: 'manifest', href: manifest });
}
function renderOther(tags, other) {
    for (const entry of other) {
        (0, tag_1.pushName)(tags, entry.name, entry.content);
    }
}
//# sourceMappingURL=render.js.map