describe('DOMException', () => {
  const errorCodes = [
    ['INDEX_SIZE_ERR', 1],
    ['DOMSTRING_SIZE_ERR', 2],
    ['HIERARCHY_REQUEST_ERR', 3],
    ['WRONG_DOCUMENT_ERR', 4],
    ['INVALID_CHARACTER_ERR', 5],
    ['NO_DATA_ALLOWED_ERR', 6],
    ['NO_MODIFICATION_ALLOWED_ERR', 7],
    ['NOT_FOUND_ERR', 8],
    ['NOT_SUPPORTED_ERR', 9],
    ['INUSE_ATTRIBUTE_ERR', 10],
    ['INVALID_STATE_ERR', 11],
    ['SYNTAX_ERR', 12],
    ['INVALID_MODIFICATION_ERR', 13],
    ['NAMESPACE_ERR', 14],
    ['INVALID_ACCESS_ERR', 15],
    ['VALIDATION_ERR', 16],
    ['TYPE_MISMATCH_ERR', 17],
    ['SECURITY_ERR', 18],
    ['NETWORK_ERR', 19],
    ['ABORT_ERR', 20],
    ['URL_MISMATCH_ERR', 21],
    ['QUOTA_EXCEEDED_ERR', 22],
    ['TIMEOUT_ERR', 23],
    ['INVALID_NODE_TYPE_ERR', 24],
    ['DATA_CLONE_ERR', 25],
  ] as const;

  const errorNameCodes = [
    ['SomethingElse', 0],
    ['IndexSizeError', DOMException.INDEX_SIZE_ERR],
    ['HierarchyRequestError', DOMException.HIERARCHY_REQUEST_ERR],
    ['WrongDocumentError', DOMException.WRONG_DOCUMENT_ERR],
    ['InvalidCharacterError', DOMException.INVALID_CHARACTER_ERR],
    ['NoModificationAllowedError', DOMException.NO_MODIFICATION_ALLOWED_ERR],
    ['NotFoundError', DOMException.NOT_FOUND_ERR],
    ['NotSupportedError', DOMException.NOT_SUPPORTED_ERR],
    ['InUseAttributeError', DOMException.INUSE_ATTRIBUTE_ERR],
    ['InvalidStateError', DOMException.INVALID_STATE_ERR],
    ['SyntaxError', DOMException.SYNTAX_ERR],
    ['InvalidModificationError', DOMException.INVALID_MODIFICATION_ERR],
    ['NamespaceError', DOMException.NAMESPACE_ERR],
    ['InvalidAccessError', DOMException.INVALID_ACCESS_ERR],
    ['TypeMismatchError', DOMException.TYPE_MISMATCH_ERR],
    ['SecurityError', DOMException.SECURITY_ERR],
    ['NetworkError', DOMException.NETWORK_ERR],
    ['AbortError', DOMException.ABORT_ERR],
    ['URLMismatchError', DOMException.URL_MISMATCH_ERR],
    ['QuotaExceededError', DOMException.QUOTA_EXCEEDED_ERR],
    ['TimeoutError', DOMException.TIMEOUT_ERR],
    ['InvalidNodeTypeError', DOMException.INVALID_NODE_TYPE_ERR],
    ['DataCloneError', DOMException.DATA_CLONE_ERR],
  ] as const;

  it('should use the Expo built-in API', () => {
    expect((DOMException as any)[Symbol.for('expo.builtin')]).toBe(true);
  });

  it('should provide error codes as static fields and instance fields', () => {
    const exception = new DOMException();

    for (const [name, code] of errorCodes) {
      expect(DOMException[name]).toBe(code);
      expect(exception[name]).toBe(code);
    }
  });

  it('should create named exceptions with legacy codes', () => {
    const exception = new DOMException('signal timed out', 'TimeoutError');

    expect(exception).toBeInstanceOf(Error);
    expect(exception.message).toBe('signal timed out');
    expect(exception.name).toBe('TimeoutError');
    expect(exception.code).toBe(DOMException.TIMEOUT_ERR);
    expect(exception.code).toBe(23);
  });

  it('should default to Error with code 0', () => {
    const exception = new DOMException('failed');

    expect(exception.name).toBe('Error');
    expect(exception.code).toBe(0);
  });

  it('should normalize names', () => {
    expect(new DOMException(undefined, undefined).name).toBe('Error');
    expect(new DOMException(undefined, '').name).toBe('');
    expect(new DOMException(undefined, null as unknown as string).name).toBe('null');
    expect(new DOMException(undefined, {} as string).name).toBe('[object Object]');
  });

  it('should assign the right code for the given name', () => {
    for (const [name, code] of errorNameCodes) {
      expect(new DOMException(undefined, name).code).toBe(code);
    }
  });
});
