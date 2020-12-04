/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifndef CertificateUtils_hpp
#define CertificateUtils_hpp

#include <openssl/pem.h>
#include <openssl/rsa.h>
#include <stdio.h>

bool generateCertSigningRequest(
    const char* appId,
    const char* csrFile,
    const char* privateKeyFile);

#endif /* CertificateUtils_hpp */
