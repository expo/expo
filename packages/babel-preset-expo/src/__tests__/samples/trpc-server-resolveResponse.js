import { getErrorShape, getHTTPStatusCode } from "./getErrorShape-DyYil4aT.mjs";
import { TRPCError, getProcedureAtPath, getTRPCErrorFromUnknown, isTrackedEnvelope, transformTRPCResponse } from "./tracked-GEWPoL0C.mjs";
import { identity, isAsyncIterable, isFunction, isObject, run } from "./utils-BHZJcBRv.mjs";
import { isObservable, observableToAsyncIterable } from "./observable-B1orLHHI.mjs";

//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function() {
	return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
//#region src/unstable-core-do-not-import/http/parseConnectionParams.ts
function parseConnectionParamsFromUnknown(parsed) {
	try {
		if (parsed === null) return null;
		if (!isObject(parsed)) throw new Error("Expected object");
		const nonStringValues = Object.entries(parsed).filter(([_key, value]) => typeof value !== "string");
		if (nonStringValues.length > 0) throw new Error(`Expected connectionParams to be string values. Got ${nonStringValues.map(([key, value]) => `${key}: ${typeof value}`).join(", ")}`);
		return parsed;
	} catch (cause) {
		throw new TRPCError({
			code: "PARSE_ERROR",
			message: "Invalid connection params shape",
			cause
		});
	}
}
function parseConnectionParamsFromString(str) {
	let parsed;
	try {
		parsed = JSON.parse(str);
	} catch (cause) {
		throw new TRPCError({
			code: "PARSE_ERROR",
			message: "Not JSON-parsable query params",
			cause
		});
	}
	return parseConnectionParamsFromUnknown(parsed);
}

//#endregion
//#region src/unstable-core-do-not-import/http/contentType.ts
/**
* Memoize a function that takes no arguments
* @internal
*/
function memo(fn) {
	let promise = null;
	const sym = Symbol.for("@trpc/server/http/memo");
	let value = sym;
	return {
		read: async () => {
			if (value !== sym) return value;
			promise ??= fn().catch((cause) => {
				if (cause instanceof TRPCError) throw cause;
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: cause instanceof Error ? cause.message : "Invalid input",
					cause
				});
			});
			value = await promise;
			promise = null;
			return value;
		},
		result: () => {
			return value !== sym ? value : void 0;
		}
	};
}
const jsonContentTypeHandler = {
	isMatch(req) {
		return !!req.headers.get("content-type")?.startsWith("application/json");
	},
	async parse(opts) {
		const { req } = opts;
		const isBatchCall = opts.searchParams.get("batch") === "1";
		const paths = isBatchCall ? opts.path.split(",") : [opts.path];
		const getInputs = memo(async () => {
			let inputs = void 0;
			if (req.method === "GET") {
				const queryInput = opts.searchParams.get("input");
				if (queryInput) inputs = JSON.parse(queryInput);
			} else inputs = await req.json();
			if (inputs === void 0) return {};
			if (!isBatchCall) return { 0: opts.router._def._config.transformer.input.deserialize(inputs) };
			if (!isObject(inputs)) throw new TRPCError({
				code: "BAD_REQUEST",
				message: "\"input\" needs to be an object when doing a batch call"
			});
			const acc = {};
			for (const index of paths.keys()) {
				const input = inputs[index];
				if (input !== void 0) acc[index] = opts.router._def._config.transformer.input.deserialize(input);
			}
			return acc;
		});
		const calls = await Promise.all(paths.map(async (path, index) => {
			const procedure = await getProcedureAtPath(opts.router, path);
			return {
				path,
				procedure,
				getRawInput: async () => {
					const inputs = await getInputs.read();
					let input = inputs[index];
					if (procedure?._def.type === "subscription") {
						const lastEventId = opts.headers.get("last-event-id") ?? opts.searchParams.get("lastEventId") ?? opts.searchParams.get("Last-Event-Id");
						if (lastEventId) if (isObject(input)) input = {
							...input,
							lastEventId
						};
						else input ??= { lastEventId };
					}
					return input;
				},
				result: () => {
					return getInputs.result()?.[index];
				}
			};
		}));
		const types = new Set(calls.map((call) => call.procedure?._def.type).filter(Boolean));
		/* istanbul ignore if -- @preserve */
		if (types.size > 1) throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Cannot mix procedure types in call: ${Array.from(types).join(", ")}`
		});
		const type = types.values().next().value ?? "unknown";
		const connectionParamsStr = opts.searchParams.get("connectionParams");
		const info = {
			isBatchCall,
			accept: req.headers.get("trpc-accept"),
			calls,
			type,
			connectionParams: connectionParamsStr === null ? null : parseConnectionParamsFromString(connectionParamsStr),
			signal: req.signal,
			url: opts.url
		};
		return info;
	}
};
const formDataContentTypeHandler = {
	isMatch(req) {
		return !!req.headers.get("content-type")?.startsWith("multipart/form-data");
	},
	async parse(opts) {
		const { req } = opts;
		if (req.method !== "POST") throw new TRPCError({
			code: "METHOD_NOT_SUPPORTED",
			message: "Only POST requests are supported for multipart/form-data requests"
		});
		const getInputs = memo(async () => {
			const fd = await req.formData();
			return fd;
		});
		const procedure = await getProcedureAtPath(opts.router, opts.path);
		return {
			accept: null,
			calls: [{
				path: opts.path,
				getRawInput: getInputs.read,
				result: getInputs.result,
				procedure
			}],
			isBatchCall: false,
			type: "mutation",
			connectionParams: null,
			signal: req.signal,
			url: opts.url
		};
	}
};
const octetStreamContentTypeHandler = {
	isMatch(req) {
		return !!req.headers.get("content-type")?.startsWith("application/octet-stream");
	},
	async parse(opts) {
		const { req } = opts;
		if (req.method !== "POST") throw new TRPCError({
			code: "METHOD_NOT_SUPPORTED",
			message: "Only POST requests are supported for application/octet-stream requests"
		});
		const getInputs = memo(async () => {
			return req.body;
		});
		return {
			calls: [{
				path: opts.path,
				getRawInput: getInputs.read,
				result: getInputs.result,
				procedure: await getProcedureAtPath(opts.router, opts.path)
			}],
			isBatchCall: false,
			accept: null,
			type: "mutation",
			connectionParams: null,
			signal: req.signal,
			url: opts.url
		};
	}
};
const handlers = [
	jsonContentTypeHandler,
	formDataContentTypeHandler,
	octetStreamContentTypeHandler
];
function getContentTypeHandler(req) {
	const handler = handlers.find((handler$1) => handler$1.isMatch(req));
	if (handler) return handler;
	if (!handler && req.method === "GET") return jsonContentTypeHandler;
	throw new TRPCError({
		code: "UNSUPPORTED_MEDIA_TYPE",
		message: req.headers.has("content-type") ? `Unsupported content-type "${req.headers.get("content-type")}` : "Missing content-type header"
	});
}
async function getRequestInfo(opts) {
	const handler = getContentTypeHandler(opts.req);
	return await handler.parse(opts);
}

//#endregion
//#region src/unstable-core-do-not-import/http/abortError.ts
function isAbortError(error) {
	return isObject(error) && error["name"] === "AbortError";
}
function throwAbortError(message = "AbortError") {
	throw new DOMException(message, "AbortError");
}

//#endregion
//#region src/vendor/unpromise/unpromise.ts
/** Memory safe (weakmapped) cache of the ProxyPromise for each Promise,
* which is retained for the lifetime of the original Promise.
*/
const subscribableCache = /* @__PURE__ */ new WeakMap();
/** A NOOP function allowing a consistent interface for settled
* SubscribedPromises (settled promises are not subscribed - they resolve
* immediately). */
const NOOP = () => {};
/**
* Every `Promise<T>` can be shadowed by a single `ProxyPromise<T>`. It is
* created once, cached and reused throughout the lifetime of the Promise. Get a
* Promise's ProxyPromise using `Unpromise.proxy(promise)`.
*
* The `ProxyPromise<T>` attaches handlers to the original `Promise<T>`
* `.then()` and `.catch()` just once. Promises derived from it use a
* subscription- (and unsubscription-) based mechanism that monitors these
* handlers.
*
* Every time you call `.subscribe()`, `.then()` `.catch()` or `.finally()` on a
* `ProxyPromise<T>` it returns a `SubscribedPromise<T>` having an additional
* `unsubscribe()` method. Calling `unsubscribe()` detaches reference chains
* from the original, potentially long-lived Promise, eliminating memory leaks.
*
* This approach can eliminate the memory leaks that otherwise come about from
* repeated `race()` or `any()` calls invoking `.then()` and `.catch()` multiple
* times on the same long-lived native Promise (subscriptions which can never be
* cleaned up).
*
* `Unpromise.race(promises)` is a reference implementation of `Promise.race`
* avoiding memory leaks when using long-lived unsettled Promises.
*
* `Unpromise.any(promises)` is a reference implementation of `Promise.any`
* avoiding memory leaks when using long-lived unsettled Promises.
*
* `Unpromise.resolve(promise)` returns an ephemeral `SubscribedPromise<T>` for
* any given `Promise<T>` facilitating arbitrary async/await patterns. Behind
* the scenes, `resolve` is implemented simply as
* `Unpromise.proxy(promise).subscribe()`. Don't forget to call `.unsubscribe()`
* to tidy up!
*
*/
var Unpromise = class Unpromise {
	/** INSTANCE IMPLEMENTATION */
	/** The promise shadowed by this Unpromise<T>  */
	promise;
	/** Promises expecting eventual settlement (unless unsubscribed first). This list is deleted
	* after the original promise settles - no further notifications will be issued. */
	subscribers = [];
	/** The Promise's settlement (recorded when it fulfils or rejects). This is consulted when
	* calling .subscribe() .then() .catch() .finally() to see if an immediately-resolving Promise
	* can be returned, and therefore subscription can be bypassed. */
	settlement = null;
	constructor(arg) {
		if (typeof arg === "function") this.promise = new Promise(arg);
		else this.promise = arg;
		const thenReturn = this.promise.then((value) => {
			const { subscribers } = this;
			this.subscribers = null;
			this.settlement = {
				status: "fulfilled",
				value
			};
			subscribers?.forEach(({ resolve }) => {
				resolve(value);
			});
		});
		if ("catch" in thenReturn) thenReturn.catch((reason) => {
			const { subscribers } = this;
			this.subscribers = null;
			this.settlement = {
				status: "rejected",
				reason
			};
			subscribers?.forEach(({ reject }) => {
				reject(reason);
			});
		});
	}
	/** Create a promise that mitigates uncontrolled subscription to a long-lived
	* Promise via .then() and .catch() - otherwise a source of memory leaks.
	*
	* The returned promise has an `unsubscribe()` method which can be called when
	* the Promise is no longer being tracked by application logic, and which
	* ensures that there is no reference chain from the original promise to the
	* new one, and therefore no memory leak.
	*
	* If original promise has not yet settled, this adds a new unique promise
	* that listens to then/catch events, along with an `unsubscribe()` method to
	* detach it.
	*
	* If original promise has settled, then creates a new Promise.resolve() or
	* Promise.reject() and provided unsubscribe is a noop.
	*
	* If you call `unsubscribe()` before the returned Promise has settled, it
	* will never settle.
	*/
	subscribe() {
		let promise;
		let unsubscribe;
		const { settlement } = this;
		if (settlement === null) {
			if (this.subscribers === null) throw new Error("Unpromise settled but still has subscribers");
			const subscriber = withResolvers();
			this.subscribers = listWithMember(this.subscribers, subscriber);
			promise = subscriber.promise;
			unsubscribe = () => {
				if (this.subscribers !== null) this.subscribers = listWithoutMember(this.subscribers, subscriber);
			};
		} else {
			const { status } = settlement;
			if (status === "fulfilled") promise = Promise.resolve(settlement.value);
			else promise = Promise.reject(settlement.reason);
			unsubscribe = NOOP;
		}
		return Object.assign(promise, { unsubscribe });
	}
	/** STANDARD PROMISE METHODS (but returning a SubscribedPromise) */
	then(onfulfilled, onrejected) {
		const subscribed = this.subscribe();
		const { unsubscribe } = subscribed;
		return Object.assign(subscribed.then(onfulfilled, onrejected), { unsubscribe });
	}
	catch(onrejected) {
		const subscribed = this.subscribe();
		const { unsubscribe } = subscribed;
		return Object.assign(subscribed.catch(onrejected), { unsubscribe });
	}
	finally(onfinally) {
		const subscribed = this.subscribe();
		const { unsubscribe } = subscribed;
		return Object.assign(subscribed.finally(onfinally), { unsubscribe });
	}
	/** TOSTRING SUPPORT */
	[Symbol.toStringTag] = "Unpromise";
	/** Unpromise STATIC METHODS */
	/** Create or Retrieve the proxy Unpromise (a re-used Unpromise for the VM lifetime
	* of the provided Promise reference) */
	static proxy(promise) {
		const cached = Unpromise.getSubscribablePromise(promise);
		return typeof cached !== "undefined" ? cached : Unpromise.createSubscribablePromise(promise);
	}
	/** Create and store an Unpromise keyed by an original Promise. */
	static createSubscribablePromise(promise) {
		const created = new Unpromise(promise);
		subscribableCache.set(promise, created);
		subscribableCache.set(created, created);
		return created;
	}
	/** Retrieve a previously-created Unpromise keyed by an original Promise. */
	static getSubscribablePromise(promise) {
		return subscribableCache.get(promise);
	}
	/** Promise STATIC METHODS */
	/** Lookup the Unpromise for this promise, and derive a SubscribedPromise from
	* it (that can be later unsubscribed to eliminate Memory leaks) */
	static resolve(value) {
		const promise = typeof value === "object" && value !== null && "then" in value && typeof value.then === "function" ? value : Promise.resolve(value);
		return Unpromise.proxy(promise).subscribe();
	}
	static async any(values) {
		const valuesArray = Array.isArray(values) ? values : [...values];
		const subscribedPromises = valuesArray.map(Unpromise.resolve);
		try {
			return await Promise.any(subscribedPromises);
		} finally {
			subscribedPromises.forEach(({ unsubscribe }) => {
				unsubscribe();
			});
		}
	}
	static async race(values) {
		const valuesArray = Array.isArray(values) ? values : [...values];
		const subscribedPromises = valuesArray.map(Unpromise.resolve);
		try {
			return await Promise.race(subscribedPromises);
		} finally {
			subscribedPromises.forEach(({ unsubscribe }) => {
				unsubscribe();
			});
		}
	}
	/** Create a race of SubscribedPromises that will fulfil to a single winning
	* Promise (in a 1-Tuple). Eliminates memory leaks from long-lived promises
	* accumulating .then() and .catch() subscribers. Allows simple logic to
	* consume the result, like...
	* ```ts
	* const [ winner ] = await Unpromise.race([ promiseA, promiseB ]);
	* if(winner === promiseB){
	*   const result = await promiseB;
	*   // do the thing
	* }
	* ```
	* */
	static async raceReferences(promises) {
		const selfPromises = promises.map(resolveSelfTuple);
		try {
			return await Promise.race(selfPromises);
		} finally {
			for (const promise of selfPromises) promise.unsubscribe();
		}
	}
};
/** Promises a 1-tuple containing the original promise when it resolves. Allows
* awaiting the eventual Promise ***reference*** (easy to destructure and
* exactly compare with ===). Avoids resolving to the Promise ***value*** (which
* may be ambiguous and therefore hard to identify as the winner of a race).
* You can call unsubscribe on the Promise to mitigate memory leaks.
* */
function resolveSelfTuple(promise) {
	return Unpromise.proxy(promise).then(() => [promise]);
}
/** VENDORED (Future) PROMISE UTILITIES */
/** Reference implementation of https://github.com/tc39/proposal-promise-with-resolvers */
function withResolvers() {
	let resolve;
	let reject;
	const promise = new Promise((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});
	return {
		promise,
		resolve,
		reject
	};
}
/** IMMUTABLE LIST OPERATIONS */
function listWithMember(arr, member) {
	return [...arr, member];
}
function listWithoutIndex(arr, index) {
	return [...arr.slice(0, index), ...arr.slice(index + 1)];
}
function listWithoutMember(arr, member) {
	const index = arr.indexOf(member);
	if (index !== -1) return listWithoutIndex(arr, index);
	return arr;
}

//#endregion
//#region src/unstable-core-do-not-import/stream/utils/disposable.ts
Symbol.dispose ??= Symbol();
Symbol.asyncDispose ??= Symbol();
/**
* Takes a value and a dispose function and returns a new object that implements the Disposable interface.
* The returned object is the original value augmented with a Symbol.dispose method.
* @param thing The value to make disposable
* @param dispose Function to call when disposing the resource
* @returns The original value with Symbol.dispose method added
*/
function makeResource(thing, dispose) {
	const it = thing;
	const existing = it[Symbol.dispose];
	it[Symbol.dispose] = () => {
		dispose();
		existing?.();
	};
	return it;
}
/**
* Takes a value and an async dispose function and returns a new object that implements the AsyncDisposable interface.
* The returned object is the original value augmented with a Symbol.asyncDispose method.
* @param thing The value to make async disposable
* @param dispose Async function to call when disposing the resource
* @returns The original value with Symbol.asyncDispose method added
*/
function makeAsyncResource(thing, dispose) {
	const it = thing;
	const existing = it[Symbol.asyncDispose];
	it[Symbol.asyncDispose] = async () => {
		await dispose();
		await existing?.();
	};
	return it;
}

//#endregion
//#region src/unstable-core-do-not-import/stream/utils/timerResource.ts
const disposablePromiseTimerResult = Symbol();
function timerResource(ms) {
	let timer = null;
	return makeResource({ start() {
		if (timer) throw new Error("Timer already started");
		const promise = new Promise((resolve) => {
			timer = setTimeout(() => resolve(disposablePromiseTimerResult), ms);
		});
		return promise;
	} }, () => {
		if (timer) clearTimeout(timer);
	});
}

//#endregion
//#region ../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/usingCtx.js
var require_usingCtx = __commonJS({ "../../node_modules/.pnpm/@oxc-project+runtime@0.72.2/node_modules/@oxc-project/runtime/src/helpers/usingCtx.js"(exports, module) {
	function _usingCtx() {
		var r = "function" == typeof SuppressedError ? SuppressedError : function(r$1, e$1) {
			var n$1 = Error();
			return n$1.name = "SuppressedError", n$1.error = r$1, n$1.suppressed = e$1, n$1;
		}, e = {}, n = [];
		function using(r$1, e$1) {
			if (null != e$1) {
				if (Object(e$1) !== e$1) throw new TypeError("using declarations can only be used with objects, functions, null, or undefined.");
				if (r$1) var o = e$1[Symbol.asyncDispose || Symbol["for"]("Symbol.asyncDispose")];
				if (void 0 === o && (o = e$1[Symbol.dispose || Symbol["for"]("Symbol.dispose")], r$1)) var t = o;
				if ("function" != typeof o) throw new TypeError("Object is not disposable.");
				t && (o = function o$1() {
					try {
						t.call(e$1);
					} catch (r$2) {
						return Promise.reject(r$2);
					}
				}), n.push({
					v: e$1,
					d: o,
					a: r$1
				});
			} else r$1 && n.push({
				d: e$1,
				a: r$1
			});
			return e$1;
		}
		return {
			e,
			u: using.bind(null, !1),
			a: using.bind(null, !0),
			d: function d() {
				var o, t = this.e, s = 0;
				function next() {
					for (; o = n.pop();) try {
						if (!o.a && 1 === s) return s = 0, n.push(o), Promise.resolve().then(next);
						if (o.d) {
							var r$1 = o.d.call(o.v);
							if (o.a) return s |= 2, Promise.resolve(r$1).then(next, err);
						} else s |= 1;
					} catch (r$2) {
						return err(r$2);
					}
					if (1 === s) return t !== e ? Promise.reject(t) : Promise.resolve();
					if (t !== e) throw t;
				}
				function err(n$1) {
					return t = t !== e ? new r(n$1, t) : n$1, next();
				}
				return next();
			}
		};
	}
	module.exports = _usingCtx, module.exports.__esModule = true, module.exports["default"] = module.exports;
} });

//#endregion
//#region src/unstable-core-do-not-import/stream/utils/asyncIterable.ts
var import_usingCtx$4 = __toESM(require_usingCtx(), 1);
function iteratorResource(iterable) {
	const iterator = iterable[Symbol.asyncIterator]();
	if (iterator[Symbol.asyncDispose]) return iterator;
	return makeAsyncResource(iterator, async () => {
		await iterator.return?.();
	});
}
/**
* Derives a new {@link AsyncGenerator} based on {@link iterable}, that automatically aborts after the specified duration.
*/
async function* withMaxDuration(iterable, opts) {
	try {
		var _usingCtx$1 = (0, import_usingCtx$4.default)();
		const iterator = _usingCtx$1.a(iteratorResource(iterable));
		const timer = _usingCtx$1.u(timerResource(opts.maxDurationMs));
		const timerPromise = timer.start();
		let result;
		while (true) {
			result = await Unpromise.race([iterator.next(), timerPromise]);
			if (result === disposablePromiseTimerResult) throwAbortError();
			if (result.done) return result;
			yield result.value;
			result = null;
		}
	} catch (_) {
		_usingCtx$1.e = _;
	} finally {
		await _usingCtx$1.d();
	}
}
/**
* Derives a new {@link AsyncGenerator} based of {@link iterable}, that yields its first
* {@link count} values. Then, a grace period of {@link gracePeriodMs} is started in which further
* values may still come through. After this period, the generator aborts.
*/
async function* takeWithGrace(iterable, opts) {
	try {
		var _usingCtx3 = (0, import_usingCtx$4.default)();
		const iterator = _usingCtx3.a(iteratorResource(iterable));
		let result;
		const timer = _usingCtx3.u(timerResource(opts.gracePeriodMs));
		let count = opts.count;
		let timerPromise = new Promise(() => {});
		while (true) {
			result = await Unpromise.race([iterator.next(), timerPromise]);
			if (result === disposablePromiseTimerResult) throwAbortError();
			if (result.done) return result.value;
			yield result.value;
			if (--count === 0) timerPromise = timer.start();
			result = null;
		}
	} catch (_) {
		_usingCtx3.e = _;
	} finally {
		await _usingCtx3.d();
	}
}

//#endregion
//#region src/unstable-core-do-not-import/stream/utils/createDeferred.ts
function createDeferred() {
	let resolve;
	let reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return {
		promise,
		resolve,
		reject
	};
}

//#endregion
//#region src/unstable-core-do-not-import/stream/utils/mergeAsyncIterables.ts
var import_usingCtx$3 = __toESM(require_usingCtx(), 1);
function createManagedIterator(iterable, onResult) {
	const iterator = iterable[Symbol.asyncIterator]();
	let state = "idle";
	function cleanup() {
		state = "done";
		onResult = () => {};
	}
	function pull() {
		if (state !== "idle") return;
		state = "pending";
		const next = iterator.next();
		next.then((result) => {
			if (result.done) {
				state = "done";
				onResult({
					status: "return",
					value: result.value
				});
				cleanup();
				return;
			}
			state = "idle";
			onResult({
				status: "yield",
				value: result.value
			});
		}).catch((cause) => {
			onResult({
				status: "error",
				error: cause
			});
			cleanup();
		});
	}
	return {
		pull,
		destroy: async () => {
			cleanup();
			await iterator.return?.();
		}
	};
}
/**
* Creates a new async iterable that merges multiple async iterables into a single stream.
* Values from the input iterables are yielded in the order they resolve, similar to Promise.race().
*
* New iterables can be added dynamically using the returned {@link MergedAsyncIterables.add} method, even after iteration has started.
*
* If any of the input iterables throws an error, that error will be propagated through the merged stream.
* Other iterables will not continue to be processed.
*
* @template TYield The type of values yielded by the input iterables
*/
function mergeAsyncIterables() {
	let state = "idle";
	let flushSignal = createDeferred();
	/**
	* used while {@link state} is `idle`
	*/
	const iterables = [];
	/**
	* used while {@link state} is `pending`
	*/
	const iterators = /* @__PURE__ */ new Set();
	const buffer = [];
	function initIterable(iterable) {
		if (state !== "pending") return;
		const iterator = createManagedIterator(iterable, (result) => {
			if (state !== "pending") return;
			switch (result.status) {
				case "yield":
					buffer.push([iterator, result]);
					break;
				case "return":
					iterators.delete(iterator);
					break;
				case "error":
					buffer.push([iterator, result]);
					iterators.delete(iterator);
					break;
			}
			flushSignal.resolve();
		});
		iterators.add(iterator);
		iterator.pull();
	}
	return {
		add(iterable) {
			switch (state) {
				case "idle":
					iterables.push(iterable);
					break;
				case "pending":
					initIterable(iterable);
					break;
				case "done": break;
			}
		},
		async *[Symbol.asyncIterator]() {
			try {
				var _usingCtx$1 = (0, import_usingCtx$3.default)();
				if (state !== "idle") throw new Error("Cannot iterate twice");
				state = "pending";
				const _finally = _usingCtx$1.a(makeAsyncResource({}, async () => {
					state = "done";
					const errors = [];
					await Promise.all(Array.from(iterators.values()).map(async (it) => {
						try {
							await it.destroy();
						} catch (cause) {
							errors.push(cause);
						}
					}));
					buffer.length = 0;
					iterators.clear();
					flushSignal.resolve();
					if (errors.length > 0) throw new AggregateError(errors);
				}));
				while (iterables.length > 0) initIterable(iterables.shift());
				while (iterators.size > 0) {
					await flushSignal.promise;
					while (buffer.length > 0) {
						const [iterator, result] = buffer.shift();
						switch (result.status) {
							case "yield":
								yield result.value;
								iterator.pull();
								break;
							case "error": throw result.error;
						}
					}
					flushSignal = createDeferred();
				}
			} catch (_) {
				_usingCtx$1.e = _;
			} finally {
				await _usingCtx$1.d();
			}
		}
	};
}

//#endregion
//#region src/unstable-core-do-not-import/stream/utils/readableStreamFrom.ts
/**
* Creates a ReadableStream from an AsyncIterable.
*
* @param iterable - The source AsyncIterable to stream from
* @returns A ReadableStream that yields values from the AsyncIterable
*/
function readableStreamFrom(iterable) {
	const iterator = iterable[Symbol.asyncIterator]();
	return new ReadableStream({
		async cancel() {
			await iterator.return?.();
		},
		async pull(controller) {
			const result = await iterator.next();
			if (result.done) {
				controller.close();
				return;
			}
			controller.enqueue(result.value);
		}
	});
}

//#endregion
//#region src/unstable-core-do-not-import/stream/utils/withPing.ts
var import_usingCtx$2 = __toESM(require_usingCtx(), 1);
const PING_SYM = Symbol("ping");
/**
* Derives a new {@link AsyncGenerator} based of {@link iterable}, that yields {@link PING_SYM}
* whenever no value has been yielded for {@link pingIntervalMs}.
*/
async function* withPing(iterable, pingIntervalMs) {
	try {
		var _usingCtx$1 = (0, import_usingCtx$2.default)();
		const iterator = _usingCtx$1.a(iteratorResource(iterable));
		let result;
		let nextPromise = iterator.next();
		while (true) try {
			var _usingCtx3 = (0, import_usingCtx$2.default)();
			const pingPromise = _usingCtx3.u(timerResource(pingIntervalMs));
			result = await Unpromise.race([nextPromise, pingPromise.start()]);
			if (result === disposablePromiseTimerResult) {
				yield PING_SYM;
				continue;
			}
			if (result.done) return result.value;
			nextPromise = iterator.next();
			yield result.value;
			result = null;
		} catch (_) {
			_usingCtx3.e = _;
		} finally {
			_usingCtx3.d();
		}
	} catch (_) {
		_usingCtx$1.e = _;
	} finally {
		await _usingCtx$1.d();
	}
}

//#endregion
//#region src/unstable-core-do-not-import/stream/jsonl.ts
var import_usingCtx$1 = __toESM(require_usingCtx(), 1);
function isPlainObject(value) {
	return Object.prototype.toString.call(value) === "[object Object]";
}
const CHUNK_VALUE_TYPE_PROMISE = 0;
const CHUNK_VALUE_TYPE_ASYNC_ITERABLE = 1;
const PROMISE_STATUS_FULFILLED = 0;
const PROMISE_STATUS_REJECTED = 1;
const ASYNC_ITERABLE_STATUS_RETURN = 0;
const ASYNC_ITERABLE_STATUS_YIELD = 1;
const ASYNC_ITERABLE_STATUS_ERROR = 2;
function isPromise(value) {
	return (isObject(value) || isFunction(value)) && typeof value?.["then"] === "function" && typeof value?.["catch"] === "function";
}
var MaxDepthError = class extends Error {
	constructor(path) {
		super("Max depth reached at path: " + path.join("."));
		this.path = path;
	}
};
async function* createBatchStreamProducer(opts) {
	const { data } = opts;
	let counter = 0;
	const placeholder = 0;
	const mergedIterables = mergeAsyncIterables();
	function registerAsync(callback) {
		const idx = counter++;
		const iterable$1 = callback(idx);
		mergedIterables.add(iterable$1);
		return idx;
	}
	function encodePromise(promise, path) {
		return registerAsync(async function* (idx) {
			const error = checkMaxDepth(path);
			if (error) {
				promise.catch((cause) => {
					opts.onError?.({
						error: cause,
						path
					});
				});
				promise = Promise.reject(error);
			}
			try {
				const next = await promise;
				yield [
					idx,
					PROMISE_STATUS_FULFILLED,
					encode(next, path)
				];
			} catch (cause) {
				opts.onError?.({
					error: cause,
					path
				});
				yield [
					idx,
					PROMISE_STATUS_REJECTED,
					opts.formatError?.({
						error: cause,
						path
					})
				];
			}
		});
	}
	function encodeAsyncIterable(iterable$1, path) {
		return registerAsync(async function* (idx) {
			try {
				var _usingCtx$1 = (0, import_usingCtx$1.default)();
				const error = checkMaxDepth(path);
				if (error) throw error;
				const iterator = _usingCtx$1.a(iteratorResource(iterable$1));
				try {
					while (true) {
						const next = await iterator.next();
						if (next.done) {
							yield [
								idx,
								ASYNC_ITERABLE_STATUS_RETURN,
								encode(next.value, path)
							];
							break;
						}
						yield [
							idx,
							ASYNC_ITERABLE_STATUS_YIELD,
							encode(next.value, path)
						];
					}
				} catch (cause) {
					opts.onError?.({
						error: cause,
						path
					});
					yield [
						idx,
						ASYNC_ITERABLE_STATUS_ERROR,
						opts.formatError?.({
							error: cause,
							path
						})
					];
				}
			} catch (_) {
				_usingCtx$1.e = _;
			} finally {
				await _usingCtx$1.d();
			}
		});
	}
	function checkMaxDepth(path) {
		if (opts.maxDepth && path.length > opts.maxDepth) return new MaxDepthError(path);
		return null;
	}
	function encodeAsync(value, path) {
		if (isPromise(value)) return [CHUNK_VALUE_TYPE_PROMISE, encodePromise(value, path)];
		if (isAsyncIterable(value)) {
			if (opts.maxDepth && path.length >= opts.maxDepth) throw new Error("Max depth reached");
			return [CHUNK_VALUE_TYPE_ASYNC_ITERABLE, encodeAsyncIterable(value, path)];
		}
		return null;
	}
	function encode(value, path) {
		if (value === void 0) return [[]];
		const reg = encodeAsync(value, path);
		if (reg) return [[placeholder], [null, ...reg]];
		if (!isPlainObject(value)) return [[value]];
		const newObj = {};
		const asyncValues = [];
		for (const [key, item] of Object.entries(value)) {
			const transformed = encodeAsync(item, [...path, key]);
			if (!transformed) {
				newObj[key] = item;
				continue;
			}
			newObj[key] = placeholder;
			asyncValues.push([key, ...transformed]);
		}
		return [[newObj], ...asyncValues];
	}
	const newHead = {};
	for (const [key, item] of Object.entries(data)) newHead[key] = encode(item, [key]);
	yield newHead;
	let iterable = mergedIterables;
	if (opts.pingMs) iterable = withPing(mergedIterables, opts.pingMs);
	for await (const value of iterable) yield value;
}
/**
* JSON Lines stream producer
* @see https://jsonlines.org/
*/
function jsonlStreamProducer(opts) {
	let stream = readableStreamFrom(createBatchStreamProducer(opts));
	const { serialize } = opts;
	if (serialize) stream = stream.pipeThrough(new TransformStream({ transform(chunk, controller) {
		if (chunk === PING_SYM) controller.enqueue(PING_SYM);
		else controller.enqueue(serialize(chunk));
	} }));
	return stream.pipeThrough(new TransformStream({ transform(chunk, controller) {
		if (chunk === PING_SYM) controller.enqueue(" ");
		else controller.enqueue(JSON.stringify(chunk) + "\n");
	} })).pipeThrough(new TextEncoderStream());
}
var AsyncError = class extends Error {
	constructor(data) {
		super("Received error from server");
		this.data = data;
	}
};
const nodeJsStreamToReaderEsque = (source) => {
	return { getReader() {
		const stream = new ReadableStream({ start(controller) {
			source.on("data", (chunk) => {
				controller.enqueue(chunk);
			});
			source.on("end", () => {
				controller.close();
			});
			source.on("error", (error) => {
				controller.error(error);
			});
		} });
		return stream.getReader();
	} };
};
function createLineAccumulator(from) {
	const reader = "getReader" in from ? from.getReader() : nodeJsStreamToReaderEsque(from).getReader();
	let lineAggregate = "";
	return new ReadableStream({
		async pull(controller) {
			const { done, value } = await reader.read();
			if (done) controller.close();
			else controller.enqueue(value);
		},
		cancel() {
			return reader.cancel();
		}
	}).pipeThrough(new TextDecoderStream()).pipeThrough(new TransformStream({ transform(chunk, controller) {
		lineAggregate += chunk;
		const parts = lineAggregate.split("\n");
		lineAggregate = parts.pop() ?? "";
		for (const part of parts) controller.enqueue(part);
	} }));
}
function createConsumerStream(from) {
	const stream = createLineAccumulator(from);
	let sentHead = false;
	return stream.pipeThrough(new TransformStream({ transform(line, controller) {
		if (!sentHead) {
			const head = JSON.parse(line);
			controller.enqueue(head);
			sentHead = true;
		} else {
			const chunk = JSON.parse(line);
			controller.enqueue(chunk);
		}
	} }));
}
/**
* Creates a handler for managing stream controllers and their lifecycle
*/
function createStreamsManager(abortController) {
	const controllerMap = /* @__PURE__ */ new Map();
	/**
	* Checks if there are no pending controllers or deferred promises
	*/
	function isEmpty() {
		return Array.from(controllerMap.values()).every((c) => c.closed);
	}
	/**
	* Creates a stream controller
	*/
	function createStreamController() {
		let originalController;
		const stream = new ReadableStream({ start(controller) {
			originalController = controller;
		} });
		const streamController = {
			enqueue: (v) => originalController.enqueue(v),
			close: () => {
				originalController.close();
				clear();
				if (isEmpty()) abortController.abort();
			},
			closed: false,
			getReaderResource: () => {
				const reader = stream.getReader();
				return makeResource(reader, () => {
					reader.releaseLock();
					streamController.close();
				});
			},
			error: (reason) => {
				originalController.error(reason);
				clear();
			}
		};
		function clear() {
			Object.assign(streamController, {
				closed: true,
				close: () => {},
				enqueue: () => {},
				getReaderResource: null,
				error: () => {}
			});
		}
		return streamController;
	}
	/**
	* Gets or creates a stream controller
	*/
	function getOrCreate(chunkId) {
		let c = controllerMap.get(chunkId);
		if (!c) {
			c = createStreamController();
			controllerMap.set(chunkId, c);
		}
		return c;
	}
	/**
	* Cancels all pending controllers and rejects deferred promises
	*/
	function cancelAll(reason) {
		for (const controller of controllerMap.values()) controller.error(reason);
	}
	return {
		getOrCreate,
		isEmpty,
		cancelAll
	};
}
/**
* JSON Lines stream consumer
* @see https://jsonlines.org/
*/
async function jsonlStreamConsumer(opts) {
	const { deserialize = (v) => v } = opts;
	let source = createConsumerStream(opts.from);
	if (deserialize) source = source.pipeThrough(new TransformStream({ transform(chunk, controller) {
		controller.enqueue(deserialize(chunk));
	} }));
	let headDeferred = createDeferred();
	const streamManager = createStreamsManager(opts.abortController);
	function decodeChunkDefinition(value) {
		const [_path, type, chunkId] = value;
		const controller = streamManager.getOrCreate(chunkId);
		switch (type) {
			case CHUNK_VALUE_TYPE_PROMISE: return run(async () => {
				try {
					var _usingCtx3 = (0, import_usingCtx$1.default)();
					const reader = _usingCtx3.u(controller.getReaderResource());
					const { value: value$1 } = await reader.read();
					const [_chunkId, status, data] = value$1;
					switch (status) {
						case PROMISE_STATUS_FULFILLED: return decode(data);
						case PROMISE_STATUS_REJECTED: throw opts.formatError?.({ error: data }) ?? new AsyncError(data);
					}
				} catch (_) {
					_usingCtx3.e = _;
				} finally {
					_usingCtx3.d();
				}
			});
			case CHUNK_VALUE_TYPE_ASYNC_ITERABLE: return run(async function* () {
				try {
					var _usingCtx4 = (0, import_usingCtx$1.default)();
					const reader = _usingCtx4.u(controller.getReaderResource());
					while (true) {
						const { value: value$1 } = await reader.read();
						const [_chunkId, status, data] = value$1;
						switch (status) {
							case ASYNC_ITERABLE_STATUS_YIELD:
								yield decode(data);
								break;
							case ASYNC_ITERABLE_STATUS_RETURN: return decode(data);
							case ASYNC_ITERABLE_STATUS_ERROR: throw opts.formatError?.({ error: data }) ?? new AsyncError(data);
						}
					}
				} catch (_) {
					_usingCtx4.e = _;
				} finally {
					_usingCtx4.d();
				}
			});
		}
	}
	function decode(value) {
		const [[data], ...asyncProps] = value;
		for (const value$1 of asyncProps) {
			const [key] = value$1;
			const decoded = decodeChunkDefinition(value$1);
			if (key === null) return decoded;
			data[key] = decoded;
		}
		return data;
	}
	const closeOrAbort = (reason) => {
		headDeferred?.reject(reason);
		streamManager.cancelAll(reason);
	};
	source.pipeTo(new WritableStream({
		write(chunkOrHead) {
			if (headDeferred) {
				const head = chunkOrHead;
				for (const [key, value] of Object.entries(chunkOrHead)) {
					const parsed = decode(value);
					head[key] = parsed;
				}
				headDeferred.resolve(head);
				headDeferred = null;
				return;
			}
			const chunk = chunkOrHead;
			const [idx] = chunk;
			const controller = streamManager.getOrCreate(idx);
			controller.enqueue(chunk);
		},
		close: () => closeOrAbort(new Error("Stream closed")),
		abort: closeOrAbort
	}), { signal: opts.abortController.signal }).catch((error) => {
		opts.onError?.({ error });
		closeOrAbort(error);
	});
	return [await headDeferred.promise, streamManager];
}

//#endregion
//#region src/unstable-core-do-not-import/stream/sse.ts
var import_usingCtx = __toESM(require_usingCtx(), 1);
const PING_EVENT = "ping";
const SERIALIZED_ERROR_EVENT = "serialized-error";
const CONNECTED_EVENT = "connected";
const RETURN_EVENT = "return";
/**
*
* @see https://html.spec.whatwg.org/multipage/server-sent-events.html
*/
function sseStreamProducer(opts) {
	const { serialize = identity } = opts;
	const ping = {
		enabled: opts.ping?.enabled ?? false,
		intervalMs: opts.ping?.intervalMs ?? 1e3
	};
	const client = opts.client ?? {};
	if (ping.enabled && client.reconnectAfterInactivityMs && ping.intervalMs > client.reconnectAfterInactivityMs) throw new Error(`Ping interval must be less than client reconnect interval to prevent unnecessary reconnection - ping.intervalMs: ${ping.intervalMs} client.reconnectAfterInactivityMs: ${client.reconnectAfterInactivityMs}`);
	async function* generator() {
		yield {
			event: CONNECTED_EVENT,
			data: JSON.stringify(client)
		};
		let iterable = opts.data;
		if (opts.emitAndEndImmediately) iterable = takeWithGrace(iterable, {
			count: 1,
			gracePeriodMs: 1
		});
		if (opts.maxDurationMs && opts.maxDurationMs > 0 && opts.maxDurationMs !== Infinity) iterable = withMaxDuration(iterable, { maxDurationMs: opts.maxDurationMs });
		if (ping.enabled && ping.intervalMs !== Infinity && ping.intervalMs > 0) iterable = withPing(iterable, ping.intervalMs);
		let value;
		let chunk;
		for await (value of iterable) {
			if (value === PING_SYM) {
				yield {
					event: PING_EVENT,
					data: ""
				};
				continue;
			}
			chunk = isTrackedEnvelope(value) ? {
				id: value[0],
				data: value[1]
			} : { data: value };
			chunk.data = JSON.stringify(serialize(chunk.data));
			yield chunk;
			value = null;
			chunk = null;
		}
	}
	async function* generatorWithErrorHandling() {
		try {
			yield* generator();
			yield {
				event: RETURN_EVENT,
				data: ""
			};
		} catch (cause) {
			if (isAbortError(cause)) return;
			const error = getTRPCErrorFromUnknown(cause);
			const data = opts.formatError?.({ error }) ?? null;
			yield {
				event: SERIALIZED_ERROR_EVENT,
				data: JSON.stringify(serialize(data))
			};
		}
	}
	const stream = readableStreamFrom(generatorWithErrorHandling());
	return stream.pipeThrough(new TransformStream({ transform(chunk, controller) {
		if ("event" in chunk) controller.enqueue(`event: ${chunk.event}\n`);
		if ("data" in chunk) controller.enqueue(`data: ${chunk.data}\n`);
		if ("id" in chunk) controller.enqueue(`id: ${chunk.id}\n`);
		if ("comment" in chunk) controller.enqueue(`: ${chunk.comment}\n`);
		controller.enqueue("\n\n");
	} })).pipeThrough(new TextEncoderStream());
}
async function withTimeout(opts) {
	try {
		var _usingCtx$1 = (0, import_usingCtx.default)();
		const timeoutPromise = _usingCtx$1.u(timerResource(opts.timeoutMs));
		const res = await Unpromise.race([opts.promise, timeoutPromise.start()]);
		if (res === disposablePromiseTimerResult) return await opts.onTimeout();
		return res;
	} catch (_) {
		_usingCtx$1.e = _;
	} finally {
		_usingCtx$1.d();
	}
}
/**
* @see https://html.spec.whatwg.org/multipage/server-sent-events.html
*/
function sseStreamConsumer(opts) {
	const { deserialize = (v) => v } = opts;
	let clientOptions = {};
	const signal = opts.signal;
	let _es = null;
	const createStream = () => new ReadableStream({
		async start(controller) {
			const [url, init] = await Promise.all([opts.url(), opts.init()]);
			const eventSource = _es = new opts.EventSource(url, init);
			controller.enqueue({
				type: "connecting",
				eventSource: _es,
				event: null
			});
			eventSource.addEventListener(CONNECTED_EVENT, (_msg) => {
				const msg = _msg;
				const options = JSON.parse(msg.data);
				clientOptions = options;
				controller.enqueue({
					type: "connected",
					options,
					eventSource
				});
			});
			eventSource.addEventListener(SERIALIZED_ERROR_EVENT, (_msg) => {
				const msg = _msg;
				controller.enqueue({
					type: "serialized-error",
					error: deserialize(JSON.parse(msg.data)),
					eventSource
				});
			});
			eventSource.addEventListener(PING_EVENT, () => {
				controller.enqueue({
					type: "ping",
					eventSource
				});
			});
			eventSource.addEventListener(RETURN_EVENT, () => {
				eventSource.close();
				controller.close();
				_es = null;
			});
			eventSource.addEventListener("error", (event) => {
				if (eventSource.readyState === eventSource.CLOSED) controller.error(event);
				else controller.enqueue({
					type: "connecting",
					eventSource,
					event
				});
			});
			eventSource.addEventListener("message", (_msg) => {
				const msg = _msg;
				const chunk = deserialize(JSON.parse(msg.data));
				const def = { data: chunk };
				if (msg.lastEventId) def.id = msg.lastEventId;
				controller.enqueue({
					type: "data",
					data: def,
					eventSource
				});
			});
			const onAbort = () => {
				try {
					eventSource.close();
					controller.close();
				} catch {}
			};
			if (signal.aborted) onAbort();
			else signal.addEventListener("abort", onAbort);
		},
		cancel() {
			_es?.close();
		}
	});
	const getStreamResource = () => {
		let stream = createStream();
		let reader = stream.getReader();
		async function dispose() {
			await reader.cancel();
			_es = null;
		}
		return makeAsyncResource({
			read() {
				return reader.read();
			},
			async recreate() {
				await dispose();
				stream = createStream();
				reader = stream.getReader();
			}
		}, dispose);
	};
	return run(async function* () {
		try {
			var _usingCtx3 = (0, import_usingCtx.default)();
			const stream = _usingCtx3.a(getStreamResource());
			while (true) {
				let promise = stream.read();
				const timeoutMs = clientOptions.reconnectAfterInactivityMs;
				if (timeoutMs) promise = withTimeout({
					promise,
					timeoutMs,
					onTimeout: async () => {
						const res = {
							value: {
								type: "timeout",
								ms: timeoutMs,
								eventSource: _es
							},
							done: false
						};
						await stream.recreate();
						return res;
					}
				});
				const result = await promise;
				if (result.done) return result.value;
				yield result.value;
			}
		} catch (_) {
			_usingCtx3.e = _;
		} finally {
			await _usingCtx3.d();
		}
	});
}
const sseHeaders = {
	"Content-Type": "text/event-stream",
	"Cache-Control": "no-cache, no-transform",
	"X-Accel-Buffering": "no",
	Connection: "keep-alive"
};

//#endregion
//#region src/unstable-core-do-not-import/http/resolveResponse.ts
function errorToAsyncIterable(err) {
	return run(async function* () {
		throw err;
	});
}
const TYPE_ACCEPTED_METHOD_MAP = {
	mutation: ["POST"],
	query: ["GET"],
	subscription: ["GET"]
};
const TYPE_ACCEPTED_METHOD_MAP_WITH_METHOD_OVERRIDE = {
	mutation: ["POST"],
	query: ["GET", "POST"],
	subscription: ["GET", "POST"]
};
function initResponse(initOpts) {
	const { ctx, info, responseMeta, untransformedJSON, errors = [], headers } = initOpts;
	let status = untransformedJSON ? getHTTPStatusCode(untransformedJSON) : 200;
	const eagerGeneration = !untransformedJSON;
	const data = eagerGeneration ? [] : Array.isArray(untransformedJSON) ? untransformedJSON : [untransformedJSON];
	const meta = responseMeta?.({
		ctx,
		info,
		paths: info?.calls.map((call) => call.path),
		data,
		errors,
		eagerGeneration,
		type: info?.calls.find((call) => call.procedure?._def.type)?.procedure?._def.type ?? "unknown"
	}) ?? {};
	if (meta.headers) {
		if (meta.headers instanceof Headers) for (const [key, value] of meta.headers.entries()) headers.append(key, value);
		else
 /**
		* @deprecated, delete in v12
		*/
		for (const [key, value] of Object.entries(meta.headers)) if (Array.isArray(value)) for (const v of value) headers.append(key, v);
		else if (typeof value === "string") headers.set(key, value);
	}
	if (meta.status) status = meta.status;
	return { status };
}
function caughtErrorToData(cause, errorOpts) {
	const { router, req, onError } = errorOpts.opts;
	const error = getTRPCErrorFromUnknown(cause);
	onError?.({
		error,
		path: errorOpts.path,
		input: errorOpts.input,
		ctx: errorOpts.ctx,
		type: errorOpts.type,
		req
	});
	const untransformedJSON = { error: getErrorShape({
		config: router._def._config,
		error,
		type: errorOpts.type,
		path: errorOpts.path,
		input: errorOpts.input,
		ctx: errorOpts.ctx
	}) };
	const transformedJSON = transformTRPCResponse(router._def._config, untransformedJSON);
	const body = JSON.stringify(transformedJSON);
	return {
		error,
		untransformedJSON,
		body
	};
}
/**
* Check if a value is a stream-like object
* - if it's an async iterable
* - if it's an object with async iterables or promises
*/
function isDataStream(v) {
	if (!isObject(v)) return false;
	if (isAsyncIterable(v)) return true;
	return Object.values(v).some(isPromise) || Object.values(v).some(isAsyncIterable);
}
async function resolveResponse(opts) {
	const { router, req } = opts;
	const headers = new Headers([["vary", "trpc-accept"]]);
	const config = router._def._config;
	const url = new URL(req.url);
	if (req.method === "HEAD") return new Response(null, { status: 204 });
	const allowBatching = opts.allowBatching ?? opts.batching?.enabled ?? true;
	const allowMethodOverride = (opts.allowMethodOverride ?? false) && req.method === "POST";
	const infoTuple = await run(async () => {
		try {
			return [void 0, await getRequestInfo({
				req,
				path: decodeURIComponent(opts.path),
				router,
				searchParams: url.searchParams,
				headers: opts.req.headers,
				url
			})];
		} catch (cause) {
			return [getTRPCErrorFromUnknown(cause), void 0];
		}
	});
	const ctxManager = run(() => {
		let result = void 0;
		return {
			valueOrUndefined: () => {
				if (!result) return void 0;
				return result[1];
			},
			value: () => {
				const [err, ctx] = result;
				if (err) throw err;
				return ctx;
			},
			create: async (info) => {
				if (result) throw new Error("This should only be called once - report a bug in tRPC");
				try {
					const ctx = await opts.createContext({ info });
					result = [void 0, ctx];
				} catch (cause) {
					result = [getTRPCErrorFromUnknown(cause), void 0];
				}
			}
		};
	});
	const methodMapper = allowMethodOverride ? TYPE_ACCEPTED_METHOD_MAP_WITH_METHOD_OVERRIDE : TYPE_ACCEPTED_METHOD_MAP;
	/**
	* @deprecated
	*/
	const isStreamCall = req.headers.get("trpc-accept") === "application/jsonl";
	const experimentalSSE = config.sse?.enabled ?? true;
	try {
		const [infoError, info] = infoTuple;
		if (infoError) throw infoError;
		if (info.isBatchCall && !allowBatching) throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Batching is not enabled on the server`
		});
		/* istanbul ignore if -- @preserve */
		if (isStreamCall && !info.isBatchCall) throw new TRPCError({
			message: `Streaming requests must be batched (you can do a batch of 1)`,
			code: "BAD_REQUEST"
		});
		await ctxManager.create(info);
		const rpcCalls = info.calls.map(async (call) => {
			const proc = call.procedure;
			try {
				if (opts.error) throw opts.error;
				if (!proc) throw new TRPCError({
					code: "NOT_FOUND",
					message: `No procedure found on path "${call.path}"`
				});
				if (!methodMapper[proc._def.type].includes(req.method)) throw new TRPCError({
					code: "METHOD_NOT_SUPPORTED",
					message: `Unsupported ${req.method}-request to ${proc._def.type} procedure at path "${call.path}"`
				});
				if (proc._def.type === "subscription") {
					/* istanbul ignore if -- @preserve */
					if (info.isBatchCall) throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Cannot batch subscription calls`
					});
				}
				const data = await proc({
					path: call.path,
					getRawInput: call.getRawInput,
					ctx: ctxManager.value(),
					type: proc._def.type,
					signal: opts.req.signal
				});
				return [void 0, { data }];
			} catch (cause) {
				const error = getTRPCErrorFromUnknown(cause);
				const input = call.result();
				opts.onError?.({
					error,
					path: call.path,
					input,
					ctx: ctxManager.valueOrUndefined(),
					type: call.procedure?._def.type ?? "unknown",
					req: opts.req
				});
				return [error, void 0];
			}
		});
		if (!info.isBatchCall) {
			const [call] = info.calls;
			const [error, result] = await rpcCalls[0];
			switch (info.type) {
				case "unknown":
				case "mutation":
				case "query": {
					headers.set("content-type", "application/json");
					if (isDataStream(result?.data)) throw new TRPCError({
						code: "UNSUPPORTED_MEDIA_TYPE",
						message: "Cannot use stream-like response in non-streaming request - use httpBatchStreamLink"
					});
					const res = error ? { error: getErrorShape({
						config,
						ctx: ctxManager.valueOrUndefined(),
						error,
						input: call.result(),
						path: call.path,
						type: info.type
					}) } : { result: { data: result.data } };
					const headResponse$1 = initResponse({
						ctx: ctxManager.valueOrUndefined(),
						info,
						responseMeta: opts.responseMeta,
						errors: error ? [error] : [],
						headers,
						untransformedJSON: [res]
					});
					return new Response(JSON.stringify(transformTRPCResponse(config, res)), {
						status: headResponse$1.status,
						headers
					});
				}
				case "subscription": {
					const iterable = run(() => {
						if (error) return errorToAsyncIterable(error);
						if (!experimentalSSE) return errorToAsyncIterable(new TRPCError({
							code: "METHOD_NOT_SUPPORTED",
							message: "Missing experimental flag \"sseSubscriptions\""
						}));
						if (!isObservable(result.data) && !isAsyncIterable(result.data)) return errorToAsyncIterable(new TRPCError({
							message: `Subscription ${call.path} did not return an observable or a AsyncGenerator`,
							code: "INTERNAL_SERVER_ERROR"
						}));
						const dataAsIterable = isObservable(result.data) ? observableToAsyncIterable(result.data, opts.req.signal) : result.data;
						return dataAsIterable;
					});
					const stream = sseStreamProducer({
						...config.sse,
						data: iterable,
						serialize: (v) => config.transformer.output.serialize(v),
						formatError(errorOpts) {
							const error$1 = getTRPCErrorFromUnknown(errorOpts.error);
							const input = call?.result();
							const path = call?.path;
							const type = call?.procedure?._def.type ?? "unknown";
							opts.onError?.({
								error: error$1,
								path,
								input,
								ctx: ctxManager.valueOrUndefined(),
								req: opts.req,
								type
							});
							const shape = getErrorShape({
								config,
								ctx: ctxManager.valueOrUndefined(),
								error: error$1,
								input,
								path,
								type
							});
							return shape;
						}
					});
					for (const [key, value] of Object.entries(sseHeaders)) headers.set(key, value);
					const headResponse$1 = initResponse({
						ctx: ctxManager.valueOrUndefined(),
						info,
						responseMeta: opts.responseMeta,
						errors: [],
						headers,
						untransformedJSON: null
					});
					return new Response(stream, {
						headers,
						status: headResponse$1.status
					});
				}
			}
		}
		if (info.accept === "application/jsonl") {
			headers.set("content-type", "application/json");
			headers.set("transfer-encoding", "chunked");
			const headResponse$1 = initResponse({
				ctx: ctxManager.valueOrUndefined(),
				info,
				responseMeta: opts.responseMeta,
				errors: [],
				headers,
				untransformedJSON: null
			});
			const stream = jsonlStreamProducer({
				...config.jsonl,
				maxDepth: Infinity,
				data: rpcCalls.map(async (res) => {
					const [error, result] = await res;
					const call = info.calls[0];
					if (error) return { error: getErrorShape({
						config,
						ctx: ctxManager.valueOrUndefined(),
						error,
						input: call.result(),
						path: call.path,
						type: call.procedure?._def.type ?? "unknown"
					}) };
					/**
					* Not very pretty, but we need to wrap nested data in promises
					* Our stream producer will only resolve top-level async values or async values that are directly nested in another async value
					*/
					const iterable = isObservable(result.data) ? observableToAsyncIterable(result.data, opts.req.signal) : Promise.resolve(result.data);
					return { result: Promise.resolve({ data: iterable }) };
				}),
				serialize: config.transformer.output.serialize,
				onError: (cause) => {
					opts.onError?.({
						error: getTRPCErrorFromUnknown(cause),
						path: void 0,
						input: void 0,
						ctx: ctxManager.valueOrUndefined(),
						req: opts.req,
						type: info?.type ?? "unknown"
					});
				},
				formatError(errorOpts) {
					const call = info?.calls[errorOpts.path[0]];
					const error = getTRPCErrorFromUnknown(errorOpts.error);
					const input = call?.result();
					const path = call?.path;
					const type = call?.procedure?._def.type ?? "unknown";
					const shape = getErrorShape({
						config,
						ctx: ctxManager.valueOrUndefined(),
						error,
						input,
						path,
						type
					});
					return shape;
				}
			});
			return new Response(stream, {
				headers,
				status: headResponse$1.status
			});
		}
		/**
		* Non-streaming response:
		* - await all responses in parallel, blocking on the slowest one
		* - create headers with known response body
		* - return a complete HTTPResponse
		*/
		headers.set("content-type", "application/json");
		const results = (await Promise.all(rpcCalls)).map((res) => {
			const [error, result] = res;
			if (error) return res;
			if (isDataStream(result.data)) return [new TRPCError({
				code: "UNSUPPORTED_MEDIA_TYPE",
				message: "Cannot use stream-like response in non-streaming request - use httpBatchStreamLink"
			}), void 0];
			return res;
		});
		const resultAsRPCResponse = results.map(([error, result], index) => {
			const call = info.calls[index];
			if (error) return { error: getErrorShape({
				config,
				ctx: ctxManager.valueOrUndefined(),
				error,
				input: call.result(),
				path: call.path,
				type: call.procedure?._def.type ?? "unknown"
			}) };
			return { result: { data: result.data } };
		});
		const errors = results.map(([error]) => error).filter(Boolean);
		const headResponse = initResponse({
			ctx: ctxManager.valueOrUndefined(),
			info,
			responseMeta: opts.responseMeta,
			untransformedJSON: resultAsRPCResponse,
			errors,
			headers
		});
		return new Response(JSON.stringify(transformTRPCResponse(config, resultAsRPCResponse)), {
			status: headResponse.status,
			headers
		});
	} catch (cause) {
		const [_infoError, info] = infoTuple;
		const ctx = ctxManager.valueOrUndefined();
		const { error, untransformedJSON, body } = caughtErrorToData(cause, {
			opts,
			ctx: ctxManager.valueOrUndefined(),
			type: info?.type ?? "unknown"
		});
		const headResponse = initResponse({
			ctx,
			info,
			responseMeta: opts.responseMeta,
			untransformedJSON,
			errors: [error],
			headers
		});
		return new Response(body, {
			status: headResponse.status,
			headers
		});
	}
}

//#endregion
export { Unpromise, __commonJS, __toESM, createDeferred, getRequestInfo, isAbortError, isPromise, iteratorResource, jsonlStreamConsumer, jsonlStreamProducer, makeAsyncResource, makeResource, parseConnectionParamsFromString, parseConnectionParamsFromUnknown, require_usingCtx, resolveResponse, sseHeaders, sseStreamConsumer, sseStreamProducer, takeWithGrace, throwAbortError, withMaxDuration };
//# sourceMappingURL=resolveResponse-DPbYgJDD.mjs.map
