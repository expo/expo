import { render } from '@testing-library/react';
import React from 'react';

import { createTextComponent, TextElement } from '.';

test('renders heading components', () => {
  Object.values(TextElement).forEach(element => {
    const Heading = createTextComponent(element);
    const { container } = render(<Heading />);

    expect(container.getElementsByTagName(element).length).toBe(1);
  });
});
