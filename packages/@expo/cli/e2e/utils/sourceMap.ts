/** A source map as written by Metro: flat, or indexed with a section per module. */
interface SourceMapJson {
  version: number;
  sources?: string[];
  mappings?: string;
  sections?: { offset: { line: number; column: number }; map: SourceMapJson }[];
}

/** Returns every source in a flat or indexed source map, in order. */
export function getSourceMapSources(map: SourceMapJson): string[] {
  if (map.sections) {
    return map.sections.flatMap((section) => getSourceMapSources(section.map));
  }
  return map.sources ?? [];
}

/** Returns the `mappings` of a flat source map, or of each section of an indexed one. */
export function getSourceMapMappings(map: SourceMapJson): string[] {
  if (map.sections) {
    return map.sections.flatMap((section) => getSourceMapMappings(section.map));
  }
  return map.mappings != null ? [map.mappings] : [];
}
