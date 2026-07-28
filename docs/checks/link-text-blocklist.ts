import { LATEST_VERSION } from '../constants/versions.js';

export const LINK_TEXT_BLOCKLIST = {
  phrases: [
    'click here',
    'click this',
    'go',
    'here',
    'information',
    'learn more',
    'more',
    'more info',
    'more information',
    'right here',
    'read more',
    'see more',
    'start',
    'this',
    'ここをクリック',
    'こちらをクリック',
    'リンク',
    '続きを読む',
    '続く',
    '全文表示',
  ] as string[],
  ignorePaths: ['pages/archive'] as string[],
  checkedVersions: ['unversioned', LATEST_VERSION] as string[],
};
