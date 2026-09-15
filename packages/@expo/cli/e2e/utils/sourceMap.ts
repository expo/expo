/**
 * Matches a section of an indexed source map, as Metro writes one per module, whose only source
 * matches `source`.
 */
export function expectSourceMapSection(source: unknown) {
  return expect.objectContaining({
    offset: { line: expect.any(Number), column: expect.any(Number) },
    map: expect.objectContaining({ version: 3, sources: [source], mappings: expect.any(String) }),
  });
}
