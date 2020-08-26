import { render } from '@testing-library/react';
import DocumentationFooter from './DocumentationFooter';

test('displays default links', () => {
  const { container } = render(<DocumentationFooter asPath="/" url={{ pathname: '/example/' }} />);

  expect(container).toHaveTextContent('Ask a question on the forums');
  expect(container).toHaveTextContent('Edit this page');
});

test('displays issues link', () => {
  const { container } = render(<DocumentationFooter asPath="/sdk/" title="test-title" />);

  expect(container).toHaveTextContent('View open issues for test-title');
});

test('displays source code link', () => {
  const { container } = render(
    <DocumentationFooter asPath="/sdk/" title="test-title" sourceCodeUrl="/" />
  );

  expect(container).toHaveTextContent('View source code for test-title');
});
