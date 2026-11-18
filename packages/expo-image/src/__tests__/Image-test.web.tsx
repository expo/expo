/** @jest-environment node */

import { renderToString } from 'react-dom/server';

import { Image } from '../Image';

describe('Image', () => {
  it('renders the img element in server rendering', () => {
    const html = renderToString(<Image source={{ uri: 'https://example.com/image.png' }} />);

    expect(html).toMatch(/<img[^>]+src="https:\/\/example\.com\/image\.png"/);
  });
});
