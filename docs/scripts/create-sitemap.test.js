import { pathSortedByPriority } from './create-sitemap.js';

const priorities = ['/get-started', '/guides', '/versions'];

describe('pathSortedByPriority', () => {
  test('index page sorts first', () => {
    expect(pathSortedByPriority('/', '/guides/foo', priorities)).toBeLessThan(0);
    expect(pathSortedByPriority('/guides/foo', '/', priorities)).toBeGreaterThan(0);
  });

  test('two priority items sort by their priority order', () => {
    expect(pathSortedByPriority('/get-started/intro', '/guides/foo', priorities)).toBeLessThan(0);
    expect(
      pathSortedByPriority('/versions/latest', '/get-started/intro', priorities)
    ).toBeGreaterThan(0);
  });

  test('two non-priority items are treated as equal', () => {
    expect(pathSortedByPriority('/random/page', '/other/page', priorities)).toBe(0);
  });

  test('priority item sorts before non-priority item', () => {
    expect(pathSortedByPriority('/guides/foo', '/random/page', priorities)).toBeLessThan(0);
  });

  test('non-priority item sorts after priority item', () => {
    expect(pathSortedByPriority('/random/page', '/guides/foo', priorities)).toBeGreaterThan(0);
  });

  test('full sort produces correct order', () => {
    const paths = [
      '/random/page',
      '/versions/latest',
      '/',
      '/guides/foo',
      '/other/page',
      '/get-started/intro',
    ];
    const sorted = paths.sort((a, b) => pathSortedByPriority(a, b, priorities));
    expect(sorted).toEqual([
      '/',
      '/get-started/intro',
      '/guides/foo',
      '/versions/latest',
      '/random/page',
      '/other/page',
    ]);
  });
});
