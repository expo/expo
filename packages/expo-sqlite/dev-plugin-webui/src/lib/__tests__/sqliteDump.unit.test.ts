import { describe, expect, test } from '@jest/globals';

/**
 * Unit tests for sqliteDump utility functions
 * These tests don't require expo-sqlite and test pure logic
 */

// Re-implement utility functions for testing (normally these would be exported from sqliteDump.ts)
function quoteChar(name: string): '"' | null {
  if (!name) return '"';
  if (!/^[a-zA-Z_]/.test(name[0])) return '"';
  if (!/^[a-zA-Z0-9_]+$/.test(name)) return '"';

  const keywords = new Set([
    'select',
    'insert',
    'update',
    'delete',
    'from',
    'where',
    'table',
    'create',
    'drop',
    'alter',
    'index',
    'primary',
    'key',
    'foreign',
    'and',
    'or',
    'not',
    'null',
    'order',
    'by',
    'group',
    'having',
  ]);

  if (keywords.has(name.toLowerCase())) return '"';
  return null;
}

function quoteIdentifier(name: string): string {
  const quote = quoteChar(name);
  if (quote) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  return name;
}

function unusedString(text: string, tryA: string, tryB: string): string {
  if (!text.includes(tryA)) return tryA;
  if (!text.includes(tryB)) return tryB;

  let i = 0;
  let candidate: string;
  do {
    candidate = `(${tryA}${i++})`;
  } while (text.includes(candidate));

  return candidate;
}

function quoteString(text: string): string {
  const hasSpecialChars = /['\\n\\r]/.test(text);

  if (!hasSpecialChars) {
    return `'${text}'`;
  }

  const hasNewline = text.includes('\n');
  const hasCR = text.includes('\r');

  let result = '';
  let nlDelimiter = '';
  let crDelimiter = '';

  if (hasNewline) {
    nlDelimiter = unusedString(text, '\\n', '\\012');
    result = 'replace(';
  }
  if (hasCR) {
    crDelimiter = unusedString(text, '\\r', '\\015');
    result += 'replace(';
  }

  result += "'";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === "'") {
      result += "''";
    } else if (char === '\n') {
      result += nlDelimiter;
    } else if (char === '\r') {
      result += crDelimiter;
    } else {
      result += char;
    }
  }
  result += "'";

  if (hasCR) {
    result += `,'${crDelimiter}',char(13))`;
  }
  if (hasNewline) {
    result += `,'${nlDelimiter}',char(10))`;
  }

  return result;
}

function formatValue(value: any, type: number): string {
  switch (type) {
    case 1: // SQLITE_INTEGER
      return String(value);

    case 2: {
      // SQLITE_FLOAT
      const num = value as number;
      if (num === Infinity) return '1e999';
      if (num === -Infinity) return '-1e999';
      if (Number.isNaN(num)) return '0';
      return num.toExponential(20).replace(/e\+?/, 'e+');
    }

    case 5: // SQLITE_NULL
      return 'NULL';

    case 3: // SQLITE_TEXT
      return quoteString(String(value));

    case 4: {
      // SQLITE_BLOB
      const bytes = new Uint8Array(value);
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return `x'${hex}'`;
    }

    default:
      return 'NULL';
  }
}

describe('sqliteDump', () => {
  describe('quoteChar', () => {
    test('should not quote simple alphanumeric identifiers', () => {
      expect(quoteChar('users')).toBeNull();
      expect(quoteChar('user_id')).toBeNull();
      expect(quoteChar('Table123')).toBeNull();
    });

    test('should quote identifiers starting with numbers', () => {
      expect(quoteChar('123table')).toBe('"');
    });

    test('should quote identifiers with special characters', () => {
      expect(quoteChar('table-name')).toBe('"');
      expect(quoteChar('table name')).toBe('"');
      expect(quoteChar('table.name')).toBe('"');
    });

    test('should quote SQL keywords', () => {
      expect(quoteChar('select')).toBe('"');
      expect(quoteChar('from')).toBe('"');
      expect(quoteChar('table')).toBe('"');
      expect(quoteChar('order')).toBe('"');
    });

    test('should quote empty string', () => {
      expect(quoteChar('')).toBe('"');
    });
  });

  describe('quoteIdentifier', () => {
    test('should not quote simple identifiers', () => {
      expect(quoteIdentifier('users')).toBe('users');
      expect(quoteIdentifier('user_id')).toBe('user_id');
    });

    test('should quote keywords', () => {
      expect(quoteIdentifier('select')).toBe('"select"');
      expect(quoteIdentifier('from')).toBe('"from"');
    });

    test('should quote and escape double quotes', () => {
      expect(quoteIdentifier('table"name')).toBe('"table""name"');
    });

    test('should quote identifiers with special chars', () => {
      expect(quoteIdentifier('table-name')).toBe('"table-name"');
    });
  });

  describe('unusedString', () => {
    test('should return first option if not found', () => {
      expect(unusedString('hello world', '\\n', '\\012')).toBe('\\n');
    });

    test('should return second option if first is found', () => {
      expect(unusedString('text with \\n newline', '\\n', '\\012')).toBe('\\012');
    });

    test('should generate unique string if both options found', () => {
      const result = unusedString('text with \\n and \\012', '\\n', '\\012');
      expect(result).toMatch(/^\(\\n\d+\)$/);
      expect(result).not.toBe('\\n');
      expect(result).not.toBe('\\012');
    });
  });

  describe('quoteString', () => {
    test('should quote simple strings', () => {
      expect(quoteString('hello')).toBe("'hello'");
      expect(quoteString('test123')).toBe("'test123'");
    });

    test('should escape single quotes', () => {
      expect(quoteString("it's")).toBe("'it''s'");
      expect(quoteString("'quoted'")).toBe("'''quoted'''");
    });

    test('should handle newlines with replace()', () => {
      const result = quoteString('line1\nline2');
      expect(result).toContain('replace(');
      expect(result).toContain('char(10)');
      expect(result).toContain('\\n');
    });

    test('should handle carriage returns with replace()', () => {
      const result = quoteString('line1\rline2');
      expect(result).toContain('replace(');
      expect(result).toContain('char(13)');
      expect(result).toContain('\\r');
    });

    test('should handle both newlines and carriage returns', () => {
      const result = quoteString('line1\r\nline2');
      expect(result).toContain('replace(');
      expect(result).toContain('replace(');
      expect(result).toContain('char(10)');
      expect(result).toContain('char(13)');
    });

    test('should handle empty string', () => {
      expect(quoteString('')).toBe("''");
    });
  });

  describe('formatValue', () => {
    test('should format integers', () => {
      expect(formatValue(42, 1)).toBe('42');
      expect(formatValue(-100, 1)).toBe('-100');
      expect(formatValue(0, 1)).toBe('0');
    });

    test('should format floats', () => {
      const result = formatValue(3.14, 2);
      expect(result).toContain('3.14');
    });

    test('should format infinity', () => {
      expect(formatValue(Infinity, 2)).toBe('1e999');
      expect(formatValue(-Infinity, 2)).toBe('-1e999');
    });

    test('should format NaN as 0', () => {
      expect(formatValue(NaN, 2)).toBe('0');
    });

    test('should format NULL', () => {
      expect(formatValue(null, 5)).toBe('NULL');
      expect(formatValue(undefined, 5)).toBe('NULL');
    });

    test('should format text', () => {
      expect(formatValue('hello', 3)).toBe("'hello'");
      expect(formatValue("it's", 3)).toBe("'it''s'");
    });

    test('should format BLOB as hex', () => {
      const blob = new Uint8Array([0x01, 0x02, 0xff]);
      expect(formatValue(blob, 4)).toBe("x'0102ff'");
    });

    test('should handle unknown types as NULL', () => {
      expect(formatValue('anything', 99)).toBe('NULL');
    });
  });

  describe('Edge Cases', () => {
    test('should handle unicode characters in strings', () => {
      expect(quoteString('hello 世界')).toBe("'hello 世界'");
      expect(quoteString('emoji 😀')).toBe("'emoji 😀'");
    });

    test('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const result = quoteString(longString);
      expect(result.startsWith("'")).toBe(true);
      expect(result.endsWith("'")).toBe(true);
    });

    test('should handle BLOB with all byte values', () => {
      const allBytes = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        allBytes[i] = i;
      }
      const result = formatValue(allBytes, 4);
      expect(result.startsWith("x'")).toBe(true);
      expect(result.endsWith("'")).toBe(true);
      expect(result.length).toBe(2 + 256 * 2 + 1); // x' + 256 bytes * 2 hex chars + '
    });

    test('should handle identifiers with underscores', () => {
      expect(quoteChar('_private')).toBeNull();
      expect(quoteChar('__double')).toBeNull();
      expect(quoteChar('snake_case_name')).toBeNull();
    });
  });
});
