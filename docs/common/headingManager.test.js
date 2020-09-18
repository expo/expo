import { BASE_HEADING_LEVEL, HeadingManager, HeadingType } from './headingManager';

const SluggerStub = {
  slug: () => {},
};

describe('HeadingManager tests', () => {
  test('instantiates properly', () => {
    const meta = { maxHeadingDepth: 2 };
    const headingManager = new HeadingManager(SluggerStub, meta);

    expect(headingManager.headings).toEqual([]);
    expect(headingManager.meta.headings).toEqual([]);
    expect(headingManager.maxNestingLevel).toBe(BASE_HEADING_LEVEL + 2);
  });

  test('_findMetaForTitle not returning same title twice', () => {
    const TITLE = 'Some Title';
    const meta = { headings: [{ title: TITLE, processed: true }] };
    const headingManager = new HeadingManager(SluggerStub, meta);

    const result = headingManager._findMetaForTitle(TITLE);
    expect(result).toBeUndefined();
  });
});

describe('HeadingManager.addHeading()', () => {
  const META_TITLE = 'Meta heading 1';
  const META_LEVEL = 3;
  const meta = { maxHeadingDepth: 3, headings: [{ title: META_TITLE, level: META_LEVEL }] };
  const headingManager = new HeadingManager(SluggerStub, meta);

  test('finds info from meta', () => {
    const result = headingManager.addHeading(META_TITLE);

    expect(result.metadata).toBeDefined();
    expect(result.title).toBe(META_TITLE);
    expect(result.level).toBe(META_LEVEL);
  });

  test('falls back to base level if unspecified', () => {
    const result = headingManager.addHeading('title not in meta', undefined);

    expect(result.level).toBe(BASE_HEADING_LEVEL);
  });

  test('uses argument level over meta level', () => {
    headingManager.meta.headings.forEach(it => (it.processed = false));

    const result = headingManager.addHeading(META_TITLE, 4);

    expect(result.level).toBe(4);
  });

  test('additional params override anything', () => {
    const result = headingManager.addHeading('unused', 5, {
      sidebarType: 'inlineCode',
      sidebarTitle: 'The Override',
      sidebarDepth: 2, // level = 4
    });

    expect(result.title).toBe('The Override');
    expect(result.level).toBe(4);
    expect(result.type).toBe(HeadingType.InlineCode);
  });

  test('level out of range unlisted', () => {
    const tooLow = headingManager.addHeading('Too Low', BASE_HEADING_LEVEL - 1);
    const ok = headingManager.addHeading('OK');
    const tooHigh = headingManager.addHeading('Too High', 1337);

    expect(headingManager.headings).toContain(ok);
    expect(headingManager.headings).not.toContain(tooLow);
    expect(headingManager.headings).not.toContain(tooHigh);
  });

  test('explicitly hidden are unlisted', () => {
    const result = headingManager.addHeading('The Unlisted', 2, {
      hideInSidebar: true,
    });

    expect(headingManager.headings).not.toContain(result);
  });
});
