import frontmatter from 'front-matter';
import fs from 'node:fs';
import path from 'node:path';

/** Use the export's sitemap so hidden pages and redirect stubs cannot become destinations. */
export default function createUrlRecoveryIndex({ urls, pagesDirectory, output }) {
  const pages = urls.map(url => {
    const route = url.replace(/^\/+|\/+$/g, '');
    const source = [
      path.join(pagesDirectory, `${route}.mdx`),
      path.join(pagesDirectory, route, 'index.mdx'),
    ].find(file => fs.existsSync(file));
    const { attributes } = source
      ? frontmatter(fs.readFileSync(source, 'utf8'))
      : { attributes: {} };

    return {
      path: url.endsWith('/') ? url : `${url}/`,
      title: typeof attributes.title === 'string' ? attributes.title : url,
      description: typeof attributes.description === 'string' ? attributes.description : '',
    };
  });

  fs.writeFileSync(output, JSON.stringify(pages));
  return pages;
}
