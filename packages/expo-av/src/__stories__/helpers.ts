function formatTime(duration: number) {
  const paddedSecs = leftPad(`${Math.floor(duration % 60)}`, '0', 2);
  const paddedMins = leftPad(`${Math.floor(duration / 60)}`, '0', 2);
  if (duration > 3600) {
    return `${Math.floor(duration / 3600)}:${paddedMins}:${paddedSecs}`;
  }
  return `${paddedMins}:${paddedSecs}`;
}

function leftPad(s: string, padWith: string, expectedMinimumSize: number) {
  if (s.length >= expectedMinimumSize) {
    return s;
  }
  return leftPad(`${padWith}${s}`, padWith, expectedMinimumSize);
}

export { leftPad, formatTime };
