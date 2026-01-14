export function hasValidTriggerObject(trigger) {
    return (trigger === null ||
        (typeof trigger === 'object' && ('type' in trigger || 'channelId' in trigger)));
}
//# sourceMappingURL=hasValidTriggerObject.js.map