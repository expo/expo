export function hasValidTriggerObject(trigger: unknown) {
  return (
    trigger === null ||
    (typeof trigger === 'object' && ('type' in trigger || 'channelId' in trigger))
  );
}
