===============
Table with code
===============

+------+----------------------------------------------------------+
| Left | Right                                                    |
+======+==========================================================+
|      | This is a code block                                     |
|      |                                                          |
|      | .. code-block:: python                                   |
|      |                                                          |
|      |     {                                                    |
|      |         'BundleTask': {                                  |
|      |             'InstanceId': 'string',                      |
|      |             'BundleId': 'string',                        |
|      |             'State': 'pending'|'waiting-for-shutdown'',  |
|      |             'StartTime': datetime(2015, 1, 1),           |
|      |             'UpdateTime': datetime(2015, 1, 1),          |
|      |             'Storage': {                                 |
|      |                 'S3': {                                  |
|      |                     'Bucket': 'string',                  |
|      |                     'Prefix': 'string',                  |
|      |                     'AWSAccessKeyId': 'string',          |
|      |                     'UploadPolicy': b'bytes',            |
|      |                     'UploadPolicySignature': 'string'    |
|      |                 }                                        |
|      |             },                                           |
|      |             'Progress': 'string',                        |
|      |             'BundleTaskError': {                         |
|      |                 'Code': 'string',                        |
|      |                 'Message': 'string'                      |
|      |             }                                            |
|      |         }                                                |
|      |    }                                                     |
+------+----------------------------------------------------------+
