import { spawnSync } from 'node:child_process';

/** Exported symbol names, exactly as `nm` printed them — mangled, with the leading underscore. */
export type SymbolSet = Set<string>;

/** Exported symbols per architecture. A thin binary yields a single entry. */
export type ArchitectureSymbols = Map<string, SymbolSet>;

/**
 * Reads the exported symbols of one Mach-O binary, per architecture. Injectable so tests never
 * shell out.
 */
export type SymbolReader = (binaryPath: string) => ArchitectureSymbols;

/** `0000000000003a10 T _symbol`, or the same without an address column. */
const SYMBOL_LINE = /^(?:[0-9a-fA-F]+)?[ \t]+[A-Za-z][ \t]+(\S+)$/;

/**
 * `/path/to/Binary (for architecture arm64):`, `SomeObject.o:`, `libfoo.a(bar.o):`.
 *
 * Tried only after {@link SYMBOL_LINE} fails, and required to look like a file, because a symbol
 * name can itself end in a colon — `__asm__("api:")` exports one.
 */
const HEADER_LINE = [/ \(for architecture [^)]+\):$/, /^\S*[./]\S*:$/];

/**
 * Parses `nm -gU` output into the set of exported symbol names.
 *
 * Throws on anything it does not recognise. An unparsable line is almost always `nm` reporting a
 * failure on stdout, and silently returning an empty set there would make two broken binaries
 * compare as equivalent.
 */
export function parseNmOutput(text: string, opts: { source?: string } = {}): SymbolSet {
  const symbols: SymbolSet = new Set();

  for (const [index, line] of text.split('\n').entries()) {
    const match = line.match(SYMBOL_LINE);
    if (match) {
      symbols.add(match[1]);
      continue;
    }
    if (line.trim() !== '' && !HEADER_LINE.some((header) => header.test(line))) {
      const where = opts.source ? ` for ${opts.source}` : '';
      throw new Error(
        `Could not read the symbol table${where}: line ${index + 1} is not a symbol, ` +
          `"${line}". Comparing exported symbols needs every line of \`nm -gU\` output to be a ` +
          `symbol, an object-file or architecture header, or blank; an unrecognised line is ` +
          `usually nm's own error text, which means the file is stripped or is not a Mach-O ` +
          `binary. Run \`nm -gU <binary>\` on it to see what nm reports.`
      );
    }
  }

  return symbols;
}

/** Parses `lipo -archs` output — one space-separated line. */
export function parseLipoArchs(text: string, source?: string): string[] {
  const architectures = text.trim().split(/\s+/).filter(Boolean);
  if (architectures.length === 0) {
    const where = source ? ` for ${source}` : '';
    throw new Error(
      `\`lipo -archs\` named no architecture${where}. Symbols are compared per architecture, and ` +
        `a binary with none would compare as equivalent to any other empty one. Run ` +
        `\`lipo -archs <binary>\` on it — an empty answer usually means the path is not a Mach-O ` +
        `binary.`
    );
  }
  return architectures;
}

/** Lists the architectures in a binary. A thin binary reports exactly one. */
export function readArchitectures(binaryPath: string): string[] {
  const stdout = run('lipo', ['-archs', binaryPath], 'read the architectures of');
  return parseLipoArchs(stdout, binaryPath);
}

/**
 * Runs `nm -gU` per architecture — external, defined symbols only.
 *
 * The architecture loop is not optional: on a fat binary `nm -gU` reports the *host* architecture
 * alone, so a regression confined to the x86_64 half of a simulator slice would never be compared.
 */
export const readExportedSymbols: SymbolReader = (binaryPath) =>
  new Map(
    readArchitectures(binaryPath).map((architecture) => [
      architecture,
      parseNmOutput(
        run('nm', ['-arch', architecture, '-gU', binaryPath], 'list the exported symbols of'),
        { source: `${binaryPath} (${architecture})` }
      ),
    ])
  );

function run(command: string, args: string[], what: string): string {
  const binaryPath = args[args.length - 1];
  const { status, stdout, stderr, error } = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  if (error || status !== 0) {
    throw new Error(
      `Could not ${what} ${binaryPath}: ` +
        `${(error?.message ?? stderr ?? '').trim() || `${command} exited with status ${status}`}. ` +
        `The equivalence check compares symbol tables, so it cannot run without them. Check that ` +
        `the path points at a framework binary (not the .framework directory) and that the Xcode ` +
        `command line tools are installed.`
    );
  }

  return stdout;
}
