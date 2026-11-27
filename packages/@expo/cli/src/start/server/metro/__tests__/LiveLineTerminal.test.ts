import { LiveLineTerminal } from '../LiveLineTerminal';
import { createFakePipeStream, createFakeTTYStream } from './fixtures/fakeTerminalStream';

describe('in a TTY', () => {
  test('redraws the live line in place', async () => {
    const { stream, lines } = createFakeTTYStream();
    const terminal = new LiveLineTerminal(stream);

    terminal.log('first');
    const line = terminal.logLive('tapped');
    await terminal.flush();
    expect(line.update('tapped 2')).toBe(true);
    await terminal.flush();
    expect(line.update('tapped 3')).toBe(true);
    await terminal.flush();

    expect(lines()).toEqual(['first', 'tapped 3']);
  });

  test('commits the live line when another line is logged', async () => {
    const { stream, lines } = createFakeTTYStream();
    const terminal = new LiveLineTerminal(stream);

    const line = terminal.logLive('tapped');
    await terminal.flush();
    terminal.log('sent');
    await terminal.flush();

    expect(line.update('tapped 2')).toBe(false);
    await terminal.flush();
    expect(lines()).toEqual(['tapped', 'sent']);
  });

  test('keeps the live line above the status', async () => {
    const { stream, lines } = createFakeTTYStream();
    const terminal = new LiveLineTerminal(stream);

    terminal.status('Bundling 50%');
    const line = terminal.logLive('tapped');
    line.update('tapped 2');
    await terminal.flush();
    expect(lines()).toEqual(['tapped 2', 'Bundling 50%']);

    expect(terminal.status('')).toBe('Bundling 50%');
    await terminal.flush();
    expect(lines()).toEqual(['tapped 2']);
  });

  test('prints a line taller than half the screen as a permanent one', async () => {
    const { stream, lines } = createFakeTTYStream({ rows: 10 });
    const terminal = new LiveLineTerminal(stream);

    const text = Array.from({ length: 6 }, (_, index) => `row ${index}`).join('\n');
    const line = terminal.logLive(text);

    expect(line.update('replaced')).toBe(false);
    await terminal.flush();
    expect(lines()).toHaveLength(6);
  });
});

describe('in a pipe', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('prints the line once, followed by its summary when another line is logged', async () => {
    const { stream, lines } = createFakePipeStream();
    const terminal = new LiveLineTerminal(stream);

    const line = terminal.logLive('tapped', { summary: () => 'repeated 2 more times' });
    expect(line.update('tapped 2')).toBe(true);
    expect(line.update('tapped 3')).toBe(true);
    terminal.log('sent');
    await terminal.flush();

    expect(lines()).toEqual(['tapped', 'repeated 2 more times', 'sent']);
  });

  test('prints the summary after a second without updates', async () => {
    const { stream, lines } = createFakePipeStream();
    const terminal = new LiveLineTerminal(stream);

    const line = terminal.logLive('tapped', { summary: () => 'repeated 1 more time' });
    line.update('tapped 2');
    jest.advanceTimersByTime(1000);
    await terminal.flush();

    expect(line.update('tapped 3')).toBe(false);
    expect(lines()).toEqual(['tapped', 'repeated 1 more time']);
  });
});
