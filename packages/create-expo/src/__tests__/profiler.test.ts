import {
  _resetForTesting,
  getReportData,
  printReport,
  profileAsync,
  profileSync,
} from '../utils/profiler';

beforeEach(() => {
  process.env.CREATE_EXPO_PROFILE = '1';
  _resetForTesting();
});

afterEach(() => {
  delete process.env.CREATE_EXPO_PROFILE;
});

describe('disabled mode', () => {
  beforeEach(() => {
    delete process.env.CREATE_EXPO_PROFILE;
  });

  it('profileAsync passes through without recording spans', async () => {
    const result = await profileAsync('test', async () => 42);
    expect(result).toBe(42);
    expect(getReportData().spans).toHaveLength(0);
  });

  it('profileSync passes through without recording spans', () => {
    const result = profileSync('test', () => 'hello');
    expect(result).toBe('hello');
    expect(getReportData().spans).toHaveLength(0);
  });

  it('printReport is a no-op', () => {
    const spy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    printReport();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('span recording', () => {
  it('records a single async span', async () => {
    const result = await profileAsync('my-task', async () => 42);
    expect(result).toBe(42);

    const report = getReportData();
    expect(report.spans).toHaveLength(1);
    expect(report.spans[0]!.label).toBe('my-task');
    expect(report.spans[0]!.parent).toBeNull();
    expect(report.spans[0]!.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('records a single sync span', () => {
    const result = profileSync('sync-task', () => 'val');
    expect(result).toBe('val');

    const report = getReportData();
    expect(report.spans).toHaveLength(1);
    expect(report.spans[0]!.label).toBe('sync-task');
    expect(report.spans[0]!.parent).toBeNull();
  });

  it('tracks parent-child nesting', async () => {
    await profileAsync('outer', async () => {
      await profileAsync('inner', async () => {
        profileSync('leaf', () => {});
      });
    });

    const report = getReportData();
    expect(report.spans).toHaveLength(3);
    expect(report.spans[0]!.label).toBe('outer');
    expect(report.spans[0]!.parent).toBeNull();
    expect(report.spans[1]!.label).toBe('inner');
    expect(report.spans[1]!.parent).toBe('outer');
    expect(report.spans[2]!.label).toBe('leaf');
    expect(report.spans[2]!.parent).toBe('inner');
  });

  it('handles duplicate labels correctly', async () => {
    await profileAsync('phase', async () => {});
    await profileAsync('phase', async () => {});

    const report = getReportData();
    expect(report.spans).toHaveLength(2);
    // Both are root spans despite same label
    expect(report.spans[0]!.parent).toBeNull();
    expect(report.spans[1]!.parent).toBeNull();
  });

  it('reports timing with reasonable accuracy', async () => {
    await profileAsync('sleep', () => new Promise((r) => setTimeout(r, 50)));

    const report = getReportData();
    expect(report.spans[0]!.durationMs).toBeGreaterThanOrEqual(40);
    expect(report.spans[0]!.durationMs).toBeLessThan(200);
  });

  it('totalMs sums root spans only', async () => {
    await profileAsync('a', async () => {
      await profileAsync('a-child', async () => {});
    });
    await profileAsync('b', async () => {});

    const report = getReportData();
    const rootSum = report.spans
      .filter((s) => s.parent === null)
      .reduce((sum, s) => sum + s.durationMs, 0);
    // totalMs should approximately equal sum of root spans
    expect(Math.abs(report.totalMs - rootSum)).toBeLessThan(1);
  });
});

describe('error propagation', () => {
  it('propagates async errors and still records span', async () => {
    await expect(
      profileAsync('failing', async () => {
        throw new Error('test error');
      })
    ).rejects.toThrow('test error');

    const report = getReportData();
    expect(report.spans).toHaveLength(1);
    expect(report.spans[0]!.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('propagates sync errors and still records span', () => {
    expect(() =>
      profileSync('failing', () => {
        throw new Error('sync error');
      })
    ).toThrow('sync error');

    const report = getReportData();
    expect(report.spans).toHaveLength(1);
  });
});

describe('printReport', () => {
  it('writes table to stderr in table mode', async () => {
    await profileAsync('test-span', async () => {});

    const spy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    printReport();
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls.map((c) => c[0]).join('');
    expect(output).toContain('Profile Report');
    expect(output).toContain('test-span');
    expect(output).toContain('Total');
    spy.mockRestore();
  });

  it('writes JSON to stderr in json mode', async () => {
    process.env.CREATE_EXPO_PROFILE = 'json';
    await profileAsync('json-span', async () => {});

    const spy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    printReport();
    const output = spy.mock.calls.map((c) => c[0]).join('');
    const parsed = JSON.parse(output.trim());
    expect(parsed.spans).toHaveLength(1);
    expect(parsed.spans[0].label).toBe('json-span');
    expect(typeof parsed.totalMs).toBe('number');
    spy.mockRestore();
  });
});
