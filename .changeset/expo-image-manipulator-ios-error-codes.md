---
'expo-image-manipulator': patch
---

[iOS] Invalid arguments now fail with different error codes. A `source` of the wrong type throws `ERR_UNION_CASE_MISMATCH` instead of `ERR_ARGUMENT_CAST`. A wrong number of arguments, such as `resize()` without options, throws `ERR_ARGUMENTS_RANGE_MISMATCH` instead of `ERR_INVALID_ARGS_NUMBER`. An invalid enum argument, such as an unsupported flip type, throws `ERR_ENUM_NO_SUCH_VALUE` instead of `ERR_ARGUMENT_CAST`. A `null` option value, such as `saveAsync({ compress: null })`, now rejects with a `TypeError` instead of `ERR_ARGUMENT_CAST`.
