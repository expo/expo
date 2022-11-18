/**
 * A set of helper functions to update file contents. This is a simplified version to internal generateCode in config-plugin.
 */

import assert from 'assert';

export interface SectionOptions {
  tag: string;
  commentPrefix: string;
}

export function appendContents(src: string, contents: string, sectionOptions: SectionOptions) {
  const start = createSectionComment(sectionOptions.commentPrefix, sectionOptions.tag, true);
  const end = createSectionComment(sectionOptions.commentPrefix, sectionOptions.tag, false);

  const regex = new RegExp(`(\\n${escapeRegExp(end)})`, 'gm');
  const match = regex.exec(src);
  if (match) {
    assert(src.indexOf(start) >= 0);
    return src.replace(regex, `\n${contents}$1`);
  } else {
    const sectionedContents = `${start}\n${contents}\n${end}`;
    return `${src}\n${sectionedContents}`;
  }
}

export function purgeContents(src: string, sectionOptions: SectionOptions) {
  const start = createSectionComment(sectionOptions.commentPrefix, sectionOptions.tag, true);
  const end = createSectionComment(sectionOptions.commentPrefix, sectionOptions.tag, false);

  const regex = new RegExp(`\\n${escapeRegExp(start)}\\n[\\s\\S]*\\n${escapeRegExp(end)}`, 'gm');
  return src.replace(regex, '');
}

function createSectionComment(commentPrefix: string, tag: string, isBeginComment: boolean) {
  if (isBeginComment) {
    return `${commentPrefix} @generated begin ${tag} - expo prebuild (DO NOT MODIFY)`;
  } else {
    return `${commentPrefix} @generated end ${tag}`;
  }
}

/**
 * Escape a string for regular expression
 *
 * Reference from {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping}
 */
function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
