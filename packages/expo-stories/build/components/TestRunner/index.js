"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestRunner = void 0;
var immutable_1 = __importDefault(require("immutable"));
var jasmine_1 = __importDefault(require("jasmine-core/lib/jasmine-core/jasmine"));
var react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
var ExponentTest_1 = __importDefault(require("./ExponentTest"));
var Portal_1 = __importDefault(require("./components/Portal"));
var RunnerError_1 = __importDefault(require("./components/RunnerError"));
var Suites_1 = __importDefault(require("./components/Suites"));
var initialState = {
    portalChildShouldBeVisible: false,
    state: immutable_1.default.fromJS({
        suites: [],
        path: ['suites'], // Path to current 'children' List in state
    }),
    testPortal: null,
    numFailed: 0,
    done: false,
    testRunnerError: null,
    results: null,
};
var TestScreen = /** @class */ (function (_super) {
    __extends(TestScreen, _super);
    function TestScreen() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = initialState;
        _this._results = '';
        _this._failures = '';
        _this._scrollViewRef = null;
        _this._isMounted = null;
        _this.setPortalChild = function (testPortal) {
            if (_this._isMounted)
                return _this.setState({ testPortal: testPortal });
        };
        _this.cleanupPortal = function () {
            return new Promise(function (resolve) {
                if (_this._isMounted)
                    _this.setState({ testPortal: null }, resolve);
            });
        };
        _this._runTests = function (modules) { return __awaiter(_this, void 0, void 0, function () {
            var _a, jasmineEnv, jasmine;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Reset results state
                        this.setState(initialState);
                        return [4 /*yield*/, this._setupJasmine()];
                    case 1:
                        _a = _b.sent(), jasmineEnv = _a.jasmineEnv, jasmine = _a.jasmine;
                        return [4 /*yield*/, Promise.all(modules.map(function (m) {
                                return m.test(jasmine, {
                                    setPortalChild: _this.setPortalChild,
                                    cleanupPortal: _this.cleanupPortal,
                                });
                            }))];
                    case 2:
                        _b.sent();
                        jasmineEnv.execute();
                        return [2 /*return*/];
                }
            });
        }); };
        return _this;
    }
    TestScreen.prototype.componentDidMount = function () {
        // We get test modules here to make sure that React Native will reload this component when tests were changed.
        if (!this.props.selectedModules.length) {
            console.log('[TEST_SUITE]', 'No selected modules');
        }
        this._runTests(this.props.selectedModules);
        this._isMounted = true;
    };
    TestScreen.prototype.componentWillUnmount = function () {
        this._isMounted = false;
    };
    TestScreen.prototype._setupJasmine = function () {
        return __awaiter(this, void 0, void 0, function () {
            var jasmineCore, jasmineEnv, jasmine, doneIfy, oldIt, oldXit, oldFit;
            var _this = this;
            return __generator(this, function (_a) {
                // Init
                jasmine_1.default.DEFAULT_TIMEOUT_INTERVAL = 10000;
                jasmineCore = jasmine_1.default.core(jasmine_1.default);
                jasmineEnv = jasmineCore.getEnv();
                // Add our custom reporters too
                jasmineEnv.addReporter(this._jasmineSetStateReporter());
                jasmineEnv.addReporter(this._jasmineConsoleReporter());
                jasmine = jasmine_1.default.interface(jasmineCore, jasmineEnv);
                doneIfy = function (fn) { return function (done) { return __awaiter(_this, void 0, void 0, function () {
                    var e_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, Promise.resolve(fn())];
                            case 1:
                                _a.sent();
                                done();
                                return [3 /*break*/, 3];
                            case 2:
                                e_1 = _a.sent();
                                done.fail(e_1);
                                return [3 /*break*/, 3];
                            case 3: return [2 /*return*/];
                        }
                    });
                }); }; };
                oldIt = jasmine.it;
                jasmine.it = function (desc, fn, t) { return oldIt.apply(jasmine, [desc, doneIfy(fn), t]); };
                oldXit = jasmine.xit;
                jasmine.xit = function (desc, fn, t) { return oldXit.apply(jasmine, [desc, doneIfy(fn), t]); };
                oldFit = jasmine.fit;
                jasmine.fit = function (desc, fn, t) { return oldFit.apply(jasmine, [desc, doneIfy(fn), t]); };
                return [2 /*return*/, {
                        jasmineCore: jasmineCore,
                        jasmineEnv: jasmineEnv,
                        jasmine: jasmine,
                    }];
            });
        });
    };
    // A jasmine reporter that writes results to the console
    TestScreen.prototype._jasmineConsoleReporter = function () {
        var failedSpecs = [];
        var app = this;
        return {
            specDone: function (result) {
                if (result.status === 'passed' || result.status === 'failed') {
                    // Open log group if failed
                    var grouping = result.status === 'passed' ? '---' : '+++';
                    if (ExponentTest_1.default && ExponentTest_1.default.log) {
                        ExponentTest_1.default.log("".concat(result.status === 'passed' ? 'PASS' : 'FAIL', " ").concat(result.fullName));
                    }
                    var emoji = result.status === 'passed' ? ':green_heart:' : ':broken_heart:';
                    console.log("".concat(grouping, " ").concat(emoji, " ").concat(result.fullName));
                    app._results += "".concat(grouping, " ").concat(result.fullName, "\n");
                    if (result.status === 'failed') {
                        app._failures += "".concat(grouping, " ").concat(result.fullName, "\n");
                        result.failedExpectations.forEach(function (_a) {
                            var _b = _a.matcherName, matcherName = _b === void 0 ? 'NO_MATCHER' : _b, message = _a.message;
                            if (ExponentTest_1.default && ExponentTest_1.default.log) {
                                ExponentTest_1.default.log("".concat(matcherName, ": ").concat(message));
                            }
                            console.log("".concat(matcherName, ": ").concat(message));
                            app._results += "".concat(matcherName, ": ").concat(message, "\n");
                            app._failures += "".concat(matcherName, ": ").concat(message, "\n");
                        });
                        failedSpecs.push(result);
                        if (app._isMounted) {
                            var result_1 = {
                                magic: '[TEST-SUITE-INPROGRESS]',
                                failed: failedSpecs.length,
                                failures: app._failures,
                                results: app._results,
                            };
                            var jsonResult = JSON.stringify(result_1);
                            app.setState({ numFailed: failedSpecs.length, results: jsonResult });
                        }
                    }
                }
            },
            jasmineStarted: function () {
                console.log('--- tests started');
            },
            jasmineDone: function () {
                console.log('--- tests done');
                console.log('--- sending results to runner');
                var result = {
                    magic: '[TEST-SUITE-END]',
                    failed: failedSpecs.length,
                    failures: app._failures,
                    results: app._results,
                };
                var jsonResult = JSON.stringify(result);
                if (app._isMounted) {
                    app.setState({ done: true, numFailed: failedSpecs.length, results: jsonResult });
                }
                if (react_native_1.Platform.OS === 'web') {
                    // This log needs to be an object for puppeteer tests
                    console.log(result);
                }
                else {
                    console.log(jsonResult);
                }
                if (ExponentTest_1.default) {
                    ExponentTest_1.default.completed(JSON.stringify({
                        failed: failedSpecs.length,
                        failures: app._failures,
                        results: app._results,
                    }));
                }
            },
        };
    };
    // A jasmine reporter that writes results to this.state
    TestScreen.prototype._jasmineSetStateReporter = function () {
        var app = this;
        return {
            suiteStarted: function (jasmineResult) {
                if (app._isMounted) {
                    app.setState(function (_a) {
                        var state = _a.state;
                        return ({
                            state: state
                                .updateIn(state.get('path'), function (children) {
                                return children.push(immutable_1.default.fromJS({
                                    result: jasmineResult,
                                    children: [],
                                    specs: [],
                                }));
                            })
                                .update('path', function (path) { return path.push(state.getIn(path).size, 'children'); }),
                        });
                    });
                }
            },
            suiteDone: function () {
                if (app._isMounted) {
                    app.setState(function (_a) {
                        var state = _a.state;
                        return ({
                            state: state
                                .updateIn(state.get('path').pop().pop(), function (children) {
                                return children.update(children.size - 1, function (child) {
                                    return child.set('result', child.get('result'));
                                });
                            })
                                .update('path', function (path) { return path.pop().pop(); }),
                        });
                    });
                }
            },
            specStarted: function (jasmineResult) {
                if (app._isMounted) {
                    app.setState(function (_a) {
                        var state = _a.state;
                        return ({
                            state: state.updateIn(state.get('path').pop().pop(), function (children) {
                                return children.update(children.size - 1, function (child) {
                                    return child.update('specs', function (specs) { return specs.push(immutable_1.default.fromJS(jasmineResult)); });
                                });
                            }),
                        });
                    });
                }
            },
            specDone: function (jasmineResult) {
                if (app.state.testPortal) {
                    console.warn("The test portal has not been cleaned up by `".concat(jasmineResult.fullName, "`. Call `cleanupPortal` before finishing the test."));
                }
                if (app._isMounted) {
                    app.setState(function (_a) {
                        var state = _a.state;
                        return ({
                            state: state.updateIn(state.get('path').pop().pop(), function (children) {
                                return children.update(children.size - 1, function (child) {
                                    return child.update('specs', function (specs) {
                                        return specs.set(specs.size - 1, immutable_1.default.fromJS(jasmineResult));
                                    });
                                });
                            }),
                        });
                    });
                }
            },
        };
    };
    TestScreen.prototype.render = function () {
        var _a = this.state, testRunnerError = _a.testRunnerError, results = _a.results, done = _a.done, numFailed = _a.numFailed, state = _a.state, portalChildShouldBeVisible = _a.portalChildShouldBeVisible, testPortal = _a.testPortal;
        if (testRunnerError) {
            return react_1.default.createElement(RunnerError_1.default, null, testRunnerError);
        }
        return (react_1.default.createElement(react_native_1.View, { testID: "test_suite_container", style: styles.container },
            react_1.default.createElement(Suites_1.default, { numFailed: numFailed, results: results, done: done, suites: state.get('suites') }),
            react_1.default.createElement(Portal_1.default, { isVisible: portalChildShouldBeVisible }, testPortal)));
    };
    return TestScreen;
}(react_1.default.Component));
exports.TestRunner = TestScreen;
exports.default = TestScreen;
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'stretch',
        justifyContent: 'center',
    },
});
//# sourceMappingURL=index.js.map