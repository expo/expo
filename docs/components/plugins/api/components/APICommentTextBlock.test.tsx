import { render } from '@testing-library/react';

import { APICommentTextBlock } from './APICommentTextBlock';
import type { CommentData } from '../APIDataTypes';

describe(APICommentTextBlock, () => {
  test('no comment', () => {
    const { container } = render(<APICommentTextBlock comment={undefined} />);
    expect(container).toMatchSnapshot();
  });

  test('basic comment', () => {
    const comment: CommentData = {
      summary: [{ kind: 'text', text: 'This is the basic comment.' }],
    };

    const { container } = render(<APICommentTextBlock comment={comment} />);
    expect(container).toMatchSnapshot();
  });

  test('comment with example', () => {
    const comment: CommentData = {
      summary: [
        {
          kind: 'text',
          text: 'Gets the referrer URL of the installed app with the [',
        },
        {
          kind: 'code',
          text: '`Install Referrer API`',
        },
        {
          kind: 'text',
          text: '](https://developer.android.com/google/play/installreferrer)\nfrom the Google Play Store. In practice, the referrer URL may not be a complete, absolute URL.',
        },
      ],
      blockTags: [
        {
          tag: '@returns',
          content: [
            {
              kind: 'text',
              text: 'A ',
            },
            {
              kind: 'code',
              text: '`Promise`',
            },
            {
              kind: 'text',
              text: ' that fulfills with a ',
            },
            {
              kind: 'code',
              text: '`string`',
            },
            {
              kind: 'text',
              text: ' of the referrer URL of the installed app.',
            },
          ],
        },
        {
          tag: '@example',
          content: [
            {
              kind: 'code',
              text: '```ts\nawait Application.getInstallReferrerAsync();\n// "utm_source=google-play&utm_medium=organic"\n```',
            },
          ],
        },
        {
          tag: '@platform',
          content: [
            {
              kind: 'text',
              text: 'android',
            },
          ],
        },
      ],
    };

    const { container } = render(<APICommentTextBlock comment={comment} />);
    expect(container).toMatchSnapshot();
  });
});
