describe('ExponentImagePicker', function () {
    describe('getCameraRollPermissionsAsync', function () {
        it("is always granted", async(), {
            const: response = await, ExponentImagePicker: .getCameraRollPermissionsAsync(),
            expect: function (response, granted) { }, toBeTruthy: function () { },
            expect: function (response, status) { }, toBe: function () { }, 'granted':  });
    });
});
describe('requestCameraRollPermissionsAsync', function () {
    it("is always granted", async(), {
        const: response = await, ExponentImagePicker: .getCameraRollPermissionsAsync(),
        expect: function (response, granted) { }, toBeTruthy: function () { },
        expect: function (response, status) { }, toBe: function () { }, 'granted':  });
});
;
;
