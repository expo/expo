import GithubSlugger from 'github-slugger';

import DocumentationSidebarRight from './DocumentationSidebarRight';

import { HeadingManager, HeadingType } from '~/common/headingManager';
import { renderWithHeadings } from '~/common/test-utilities';
import { HeadingsContext } from '~/components/page-higher-order/withHeadingManager';

const prepareHeadingManager = () => {
  const headingManager = new HeadingManager(new GithubSlugger(), { headings: [] });
  headingManager.addHeading('Base level heading', undefined, {});
  headingManager.addHeading('Level 3 subheading', 3, {});
  headingManager.addHeading('Code heading depth 1', 0, {
    sidebarDepth: 1,
    sidebarType: HeadingType.InlineCode,
  });

  return headingManager;
};

describe('DocumentationSidebarRight', () => {
  test('correctly matches snapshot', () => {
    const headingManager = prepareHeadingManager();

    const { container } = renderWithHeadings(
      <HeadingsContext.Provider value={headingManager}>
        <DocumentationSidebarRight />
      </HeadingsContext.Provider>
    );
    expect(container).toMatchSnapshot();
  });
});
