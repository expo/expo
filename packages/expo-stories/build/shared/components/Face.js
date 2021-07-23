"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.landmarks = exports.face = exports.scaledLandmarks = exports.scaledFace = void 0;
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var landmarkSize = 2;
exports.scaledFace = function (scale) { return function (_a) {
    var faceID = _a.faceID, bounds = _a.bounds, rollAngle = _a.rollAngle, yawAngle = _a.yawAngle;
    return (react_1.default.createElement(react_native_1.View, { key: faceID, style: [
            styles.face,
            {
                width: bounds.size.width * scale,
                height: bounds.size.height * scale,
                left: bounds.origin.x * scale,
                top: bounds.origin.y * scale,
                transform: [
                    { perspective: 600 },
                    { rotateZ: rollAngle.toFixed(0) + "deg" },
                    { rotateY: yawAngle.toFixed(0) + "deg" },
                ],
            },
        ] },
        react_1.default.createElement(react_native_1.Text, { style: styles.faceText },
            "ID: ",
            faceID),
        react_1.default.createElement(react_native_1.Text, { style: styles.faceText },
            "rollAngle: ",
            rollAngle.toFixed(0)),
        react_1.default.createElement(react_native_1.Text, { style: styles.faceText },
            "yawAngle: ",
            yawAngle.toFixed(0))));
}; };
exports.scaledLandmarks = function (scale) { return function (face) {
    var renderLandmark = function (position) {
        var _a, _b;
        return position && (react_1.default.createElement(react_native_1.View, { key: "" + ((_a = position === null || position === void 0 ? void 0 : position.x) !== null && _a !== void 0 ? _a : 'no-x') + ((_b = position === null || position === void 0 ? void 0 : position.y) !== null && _b !== void 0 ? _b : 'no-y'), style: [
                styles.landmark,
                {
                    left: (position.x - landmarkSize / 2) * scale,
                    top: (position.y - landmarkSize / 2) * scale,
                },
            ] }));
    };
    console.log('landmark', face);
    return (react_1.default.createElement(react_native_1.View, { key: "landmarks-" + face.faceID },
        renderLandmark(face.leftEyePosition),
        renderLandmark(face.rightEyePosition),
        renderLandmark(face.leftEarPosition),
        renderLandmark(face.rightEarPosition),
        renderLandmark(face.leftCheekPosition),
        renderLandmark(face.rightCheekPosition),
        renderLandmark(face.leftMouthPosition),
        renderLandmark(face.mouthPosition),
        renderLandmark(face.rightMouthPosition),
        renderLandmark(face.noseBasePosition),
        renderLandmark(face.bottomMouthPosition)));
}; };
exports.face = exports.scaledFace(1);
exports.landmarks = exports.scaledLandmarks(1);
var styles = react_native_1.StyleSheet.create({
    face: {
        padding: 10,
        borderWidth: 2,
        borderRadius: 2,
        position: 'absolute',
        borderColor: '#FFD700',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    landmark: {
        width: landmarkSize,
        height: landmarkSize,
        position: 'absolute',
        backgroundColor: 'red',
    },
    faceText: {
        color: '#FFD700',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: 10,
        backgroundColor: 'transparent',
    },
});
//# sourceMappingURL=Face.js.map