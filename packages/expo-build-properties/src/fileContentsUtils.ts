/**
 * A set of helper functions to update file contents. This is a simplified version to the config-plugins internal generateCode functions.
 */

import assert from 'assert';

/**
 * Options for a generated section
 */
export interface SectionOptions {
  /**
   * A meaningful tag to differentiate the generated section
   */
  tag: string;

  /**
   * Defines comment for the generated code.
   * E.g. '//' for js code or '#' for shell script
   */
  commentPrefix: string;
}

/**
 * Append new contents to src with generated section comments
 *
 * If there is already a generated section, this function will append the new contents at the end of the section.
 * Otherwise, this function will generate a new section at the end of file.
 */
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

/**
 * Purge a generated section
 */
export function purgeContents(src: string, sectionOptions: SectionOptions) {
  const start = createSectionComment(sectionOptions.commentPrefix, sectionOptions.tag, true);
  const end = createSectionComment(sectionOptions.commentPrefix, sectionOptions.tag, false);

  const regex = new RegExp(`\\n${escapeRegExp(start)}\\n[\\s\\S]*\\n${escapeRegExp(end)}`, 'gm');
  return src.replace(regex, '');
}

/**
 * Create comments for generated section
 */
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
