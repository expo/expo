"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testCondition = exports.testContainerQuery = exports.testPseudoClasses = exports.testMediaQuery = void 0;
const utils_1 = require("../../css-to-rn/utils");
const globals_1 = require("./globals");
const defaultConditionReference = {
    width: globals_1.vw,
    height: globals_1.vh,
};
/**
 * Test a media query against current conditions
 */
function testMediaQuery(mediaQuery, conditionReference = defaultConditionReference) {
    const pass = testCondition(mediaQuery.condition, conditionReference);
    return mediaQuery.qualifier === "not" ? !pass : pass;
}
exports.testMediaQuery = testMediaQuery;
function testPseudoClasses(interaction, meta) {
    if (meta.active && !(interaction === null || interaction === void 0 ? void 0 : interaction.active.get()))
        return false;
    if (meta.hover && !(interaction === null || interaction === void 0 ? void 0 : interaction.hover.get()))
        return false;
    if (meta.focus && !(interaction === null || interaction === void 0 ? void 0 : interaction.focus.get()))
        return false;
    return true;
}
exports.testPseudoClasses = testPseudoClasses;
function testContainerQuery(containerQuery, containers = {}) {
    // If there is no query, we passed
    if (!containerQuery || containerQuery.length === 0) {
        return true;
    }
    return containerQuery.every((query) => {
        // If the query has a name, but the container doesn't exist, we failed
        if (query.name && !containers[query.name])
            return false;
        // If the query has a name, we use the container with that name
        // Otherwise default to the last container
        const container = query.name
            ? containers[query.name]
            : containers.__default;
        // We failed if the container doesn't exist (e.g no default container)
        if (!container)
            return false;
        if (query.pseudoClasses &&
            !testPseudoClasses(container.interaction, query.pseudoClasses)) {
            return false;
        }
        // If there is no condition, we passed (maybe only named as specified)
        if (!query.condition)
            return true;
        return testCondition(query.condition, {
            width: container.interaction.layout.width,
            height: container.interaction.layout.height,
        });
    });
}
exports.testContainerQuery = testContainerQuery;
/**
 * Test a media condition against current conditions
 * This is also used for container queries
 */
function testCondition(condition, conditionReference) {
    if (!condition)
        return true;
    if (condition.type === "operation") {
        if (condition.operator === "and") {
            return condition.conditions.every((c) => testCondition(c, conditionReference));
        }
        else {
            return condition.conditions.some((c) => testCondition(c, conditionReference));
        }
    }
    else if (condition.type === "not") {
        return !testCondition(condition.value, conditionReference);
    }
    return testFeature(condition.value, conditionReference);
}
exports.testCondition = testCondition;
function testFeature(feature, conditionReference) {
    switch (feature.type) {
        case "plain":
            return testPlainFeature(feature, conditionReference);
        case "range":
            return testRange(feature, conditionReference);
        case "boolean":
            return testBoolean(feature);
        case "interval":
            return false;
        default:
            (0, utils_1.exhaustiveCheck)(feature);
    }
    return false;
}
function testPlainFeature(feature, ref) {
    const value = getMediaFeatureValue(feature.value);
    if (value === null) {
        return false;
    }
    switch (feature.name) {
        case "prefers-color-scheme":
            return globals_1.colorScheme.get() === value;
        case "width":
            return testComparision("equal", ref.width, value);
        case "min-width":
            return testComparision("greater-than-equal", ref.width, value);
        case "max-width":
            return testComparision("less-than-equal", ref.width, value);
        case "height":
            return testComparision("equal", ref.height, value);
        case "min-height":
            return testComparision("greater-than-equal", ref.height, value);
        case "max-height":
            return testComparision("less-than-equal", ref.height, value);
        default:
            return false;
    }
}
function getMediaFeatureValue(value) {
    if (value.type === "number") {
        return value.value;
    }
    else if (value.type === "length") {
        if (value.value.type === "value") {
            if (value.value.value.unit === "px") {
                return value.value.value.value;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    }
    else if (value.type === "ident") {
        return value.value;
    }
    return null;
}
function testRange(feature, ref) {
    const value = getMediaFeatureValue(feature.value);
    if (value === null || typeof value !== "number") {
        return false;
    }
    /*eslint no-fallthrough: ["error", { "commentPattern": "break[\\s\\w]*omitted" }]*/
    switch (feature.name) {
        case "height":
            return testComparision(feature.operator, ref.height, value);
        case "width":
            return testComparision(feature.operator, ref.width, value);
    }
    return false;
}
function testComparision(comparision, ref, value) {
    if (typeof value !== "number")
        return false;
    switch (comparision) {
        case "equal":
            return unwrap(ref) === value;
        case "greater-than":
            return unwrap(ref) > value;
        case "greater-than-equal":
            return unwrap(ref) >= value;
        case "less-than":
            return unwrap(ref) < value;
        case "less-than-equal":
            return unwrap(ref) < value;
    }
}
function testBoolean(feature) {
    switch (feature.name) {
        case "prefers-reduced-motion":
            return globals_1.isReduceMotionEnabled.get();
    }
    return false;
}
function unwrap(value) {
    return value && typeof value === "object" && "get" in value
        ? value.get()
        : value;
}
//# sourceMappingURL=conditions.js.map