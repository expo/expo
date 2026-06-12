import { render } from '@testing-library/react-native';
import React from 'react';

import {
  ServerInsertedHTMLContext,
  useServerInsertedHTML,
  type ServerInsertedHTMLCallback,
} from '../ServerInsertedHTML';

function Probe() {
  useServerInsertedHTML(() => <meta name="test" content="value" />);
  return null;
}

describe(useServerInsertedHTML, () => {
  it('registers the callback when the context is provided', () => {
    const callbacks: ServerInsertedHTMLCallback[] = [];

    render(
      <ServerInsertedHTMLContext.Provider value={(callback) => callbacks.push(callback)}>
        <Probe />
      </ServerInsertedHTMLContext.Provider>
    );

    expect(callbacks).toHaveLength(1);
    expect(callbacks[0]()).toEqual(<meta name="test" content="value" />);
  });

  it('is a no-op when the context is not provided', () => {
    expect(() => render(<Probe />)).not.toThrow();
  });
});
