import { createSelectionFilter } from '../prompts';

describe(createSelectionFilter, () => {
  it(`searches values`, async () => {
    const filter = createSelectionFilter();
    const choices = [{ title: 'bacon' }, { title: `\\hey` }];

    for (const [search, result] of [
      [`\\`, `\\hey`],
      [`on`, `bacon`],
    ]) {
      expect(await filter(search, choices)).toEqual([{ title: result }]);
    }
    // escaped
    expect(await filter('\\\n\t\r', choices)).toEqual([]);
  });
});
