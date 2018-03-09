const fs = require('fs-extra');
const fm = require('front-matter');
const prettier = require('prettier');

const ORIGINAL_PATH_PREFIX = './versions';
const DESTINATION_PATH_PREFIX = './pages/versions';

var showdown = require('showdown');
var converter = new showdown.Converter({ tables: true });

const replaceTables = markdown => {
  let lines = markdown.split('\n');
  if (lines.length === 0) {
    return '';
  }

  let convertedMarkdown = markdown;
  for (var i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.match(/^(\|[: -]+)+\|?$/)) {
      for (var end = i + 1; end < lines.length; end++) {
        if (!lines[end].startsWith('|')) {
          let txt = '\n' + lines.slice(i - 1, end).join('\n') + '\n';
          var html = '\n' + converter.makeHtml(txt).replace(/style=/gi, 'inert=');
          // Splice in the table HTML and then, run `replaceTables` again on the remaining text
          convertedMarkdown =
            lines.slice(0, i - 2).join('\n') +
            html +
            '\n\n' +
            replaceTables(lines.slice(end + 1).join('\n'));
          return convertedMarkdown;
        }
      }
    }
  }
  return convertedMarkdown;
};

const generateJsPage = (filePath, filename) => {
  const code = fs.readFileSync(`${ORIGINAL_PATH_PREFIX}/${filePath}/${filename}.md`, 'utf8');

  const content = fm(code);
  let markdown = content.body;
  const frontmatter = content.attributes;

  // Perform neccessary replacements

  // Fix type syntax
  markdown = markdown.replace(/Array<\w*?(>)/g, match => {
    return match.replace(/>/gi, '&gt;');
  });

  markdown = markdown.replace(/Array</g, match => {
    return match.replace(/</gi, '&lt;');
  });

  // markdown-in-js, which uses commonmark, doesn't support Markdown table syntax so we use showdown to
  // generate HTML from the markdown tables, and inline that into the markdown
  markdown = replaceTables(markdown);

  // Replace '--' with '—'
  markdown = markdown.replace(/\B--\B/g, '—');

  // Replace ` and ``` blocks with <InlineCode> and <Code> components respectively
  let codeBlocks = 0;
  let inlineCodeBlocks = 0;
  markdown = markdown.replace(/(`{1,3})/gi, (match, quotes) => {
    if (quotes === '```') {
      // Replace ``` with <Code> and </Code>
      if (codeBlocks % 2 === 0) {
        codeBlocks++;
        return '${(<Code>{`';
      } else {
        codeBlocks++;
        return '`}</Code>)}';
      }
    } else {
      // If we are inside a <Code> block, return \`, not <InlineCode>
      if (codeBlocks % 2 === 1) {
        return '\\`';
      }
      if (inlineCodeBlocks % 2 === 0) {
        inlineCodeBlocks++;
        return '${(<InlineCode>{`';
      } else {
        inlineCodeBlocks++;
        return '`}</InlineCode>)}';
      }
    }
  });

  // Replace $ with \$ (i.e. escape $) inside <Code> and <InlineCode> blocks
  let regex = /<Code>{`([\s\S]*?)`}<\/Code>/g;
  markdown = markdown.replace(regex, match => {
    return match.replace(/\$/gi, '\\$');
  });

  regex = /<InlineCode>{`([\s\S]*?)`}<\/InlineCode>/g;
  markdown = markdown.replace(regex, match => {
    return match.replace(/\$/gi, '\\$');
  });

  // Extract language marker from ``` blocks and turn it into a prop on <Code>
  regex = /<Code>{`(\S*)/g;
  markdown = markdown.replace(regex, (match, lang) => {
    return `<Code lang='${lang}'>{\``;
  });

  // Replace URLs for images
  regex = /!\[.*\]\((.*)\.(gif|png|jpg|jpeg|svg)/g;
  markdown = markdown.replace(regex, match => {
    return match.replace('./', `/static/images/generated/${filePath}/`);
  });

  // Linkify URLs
  regex = /(\s)(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))\b/g;
  markdown = markdown.replace(regex, (match, leadingSpace, url) => {
    return leadingSpace + `[${url}](${url})`;
  });

  let output = `
  import React from 'react';
  import markdown from 'markdown-in-js';
  import withDoc, { components } from '~/lib/with-doc';
  import { Code, InlineCode } from '~/components/base/code';
  import SnackEmbed from '~/components/plugins/snack-embed';
  export default withDoc({
    title: '${frontmatter.title}',
  })(markdown(components)\`
  ${markdown}
  \`);
  `;

  // Run prettier over the code
  const options = prettier.resolveConfig.sync('../.prettierrc');
  output = prettier.format(output, options);

  // Create directory if it doesn't exist
  fs.ensureDirSync(`${DESTINATION_PATH_PREFIX}/${filePath}`);
  fs.writeFileSync(`${DESTINATION_PATH_PREFIX}/${filePath}/${filename}.js`, output);
};

module.exports = generateJsPage;
