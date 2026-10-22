const STACK_FRAME_PATTERN = /^\s*at /;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Removes the first frame of the stack when it is a frame of `functionName`. The message can
 * contain newlines, so the first frame is the first line that is a stack frame.
 */
export function removeFirstFrame(
  stack: string | undefined,
  functionName: string
): string | undefined {
  if (stack === undefined) {
    return undefined;
  }
  const lines = stack.split('\n');
  const firstFrameIndex = lines.findIndex((line) => STACK_FRAME_PATTERN.test(line));
  if (firstFrameIndex === -1) {
    return stack;
  }
  const functionFramePattern = new RegExp(`^\\s*at ${escapeRegExp(functionName)} `);
  if (!functionFramePattern.test(lines[firstFrameIndex] ?? '')) {
    return stack;
  }
  return [...lines.slice(0, firstFrameIndex), ...lines.slice(firstFrameIndex + 1)].join('\n');
}
