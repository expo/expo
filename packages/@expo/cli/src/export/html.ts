// <link rel="preload" href="/_expo/static/css/xxxxxx.css" as="style">
export function appendLinkToHtml(
  html: string,
  links: { rel: string; href: string; as?: string }[]
) {
  return html.replace(
    '</head>',
    links
      .map((link) => {
        let linkTag = `<link rel="${link.rel}"`;

        if (link.href) linkTag += ` href="${link.href}"`;
        if (link.as) linkTag += ` as="${link.as}"`;

        linkTag += '>';

        return linkTag;
      })
      .join('') + '</head>'
  );
}

export function appendScriptsToHtml(html: string, scripts: string[]) {
  return html.replace(
    '</body>',
    scripts.map((script) => `<script src="${script}" defer></script>`).join('') + '</body>'
  );
}
