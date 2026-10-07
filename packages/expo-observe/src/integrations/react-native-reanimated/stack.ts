// The leading frames of a stack captured in the integration's `onLog` callback, in order: the
// callback (`reportReanimatedLog` in `init.ts`), then Reanimated's `handleLog`, then the `logger`
// method that the caller used. Hermes and V8 can qualify a method name, as in `Object.error`.
const LOGGER_FRAME_PATTERNS = [
  /^\s*at reportReanimatedLog /,
  /^\s*at handleLog /,
  /^\s*at (?:\S+\.)?(?:error|warn|warnOnce) /,
];
const STACK_FRAME_PATTERN = /^\s*at /;

/**
 * Removes the leading frames that are the same for every Reanimated error, so the stack starts
 * at the code that called Reanimated's logger. The message can contain newlines, so the frames
 * start at the first line that is a stack frame. Frames are removed only while they match the
 * expected order.
 */
export function removeLoggerFrames(stack: string | undefined): string | undefined {
  if (stack === undefined) {
    return undefined;
  }
  const lines = stack.split('\n');
  const firstFrameIndex = lines.findIndex((line) => STACK_FRAME_PATTERN.test(line));
  if (firstFrameIndex === -1) {
    return stack;
  }
  let index = firstFrameIndex;
  for (const pattern of LOGGER_FRAME_PATTERNS) {
    const line = lines[index];
    if (line === undefined || !pattern.test(line)) {
      break;
    }
    index++;
  }
  return [...lines.slice(0, firstFrameIndex), ...lines.slice(index)].join('\n');
}
