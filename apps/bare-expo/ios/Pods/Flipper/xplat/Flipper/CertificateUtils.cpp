/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CertificateUtils.h"

#include <fcntl.h>
#include <folly/portability/Fcntl.h>
#include <folly/portability/SysStat.h>
#include <openssl/pem.h>
#include <openssl/rsa.h>
#include <cstring>

void free(
    EVP_PKEY* pKey,
    X509_REQ* x509_req,
    BIGNUM* bne,
    BIO* privateKey,
    BIO* csrBio);

bool generateCertSigningRequest(
    const char* appId,
    const char* csrFile,
    const char* privateKeyFile) {
  int ret = 0;
  BIGNUM* bne = NULL;

  int nVersion = 1;
  int bits = 2048;

  // Using 65537 as exponent
  unsigned long e = RSA_F4;

  X509_NAME* x509_name = NULL;

  const char* subjectCountry = "US";
  const char* subjectProvince = "CA";
  const char* subjectCity = "Menlo Park";
  const char* subjectOrganization = "Flipper";
  const char* subjectCommon = appId;

  X509_REQ* x509_req = X509_REQ_new();
  EVP_PKEY* pKey = EVP_PKEY_new();
  RSA* rsa = RSA_new();
  BIO* privateKey = NULL;
  BIO* csrBio = NULL;

  EVP_PKEY_assign_RSA(pKey, rsa);

  // Generate rsa key
  bne = BN_new();
  BN_set_flags(bne, BN_FLG_CONSTTIME);
  ret = BN_set_word(bne, e);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  ret = RSA_generate_key_ex(rsa, bits, bne, NULL);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  {
    // Write private key to a file
    int privateKeyFd =
        open(privateKeyFile, O_CREAT | O_WRONLY, S_IWUSR | S_IRUSR);
    if (privateKeyFd < 0) {
      free(pKey, x509_req, bne, privateKey, csrBio);
      return -1;
    }
    FILE* privateKeyFp = fdopen(privateKeyFd, "w");
    if (privateKeyFp == NULL) {
      free(pKey, x509_req, bne, privateKey, csrBio);
      return -1;
    }
    privateKey = BIO_new_fp(privateKeyFp, BIO_CLOSE);
    ret =
        PEM_write_bio_RSAPrivateKey(privateKey, rsa, NULL, NULL, 0, NULL, NULL);
    if (ret != 1) {
      free(pKey, x509_req, bne, privateKey, csrBio);
      return ret;
    }
  }

  rsa = NULL;

  ret = BIO_flush(privateKey);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  ret = X509_REQ_set_version(x509_req, nVersion);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  x509_name = X509_REQ_get_subject_name(x509_req);

  ret = X509_NAME_add_entry_by_txt(
      x509_name,
      "C",
      MBSTRING_ASC,
      (const unsigned char*)subjectCountry,
      -1,
      -1,
      0);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  ret = X509_NAME_add_entry_by_txt(
      x509_name,
      "ST",
      MBSTRING_ASC,
      (const unsigned char*)subjectProvince,
      -1,
      -1,
      0);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  ret = X509_NAME_add_entry_by_txt(
      x509_name,
      "L",
      MBSTRING_ASC,
      (const unsigned char*)subjectCity,
      -1,
      -1,
      0);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  ret = X509_NAME_add_entry_by_txt(
      x509_name,
      "O",
      MBSTRING_ASC,
      (const unsigned char*)subjectOrganization,
      -1,
      -1,
      0);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  ret = X509_NAME_add_entry_by_txt(
      x509_name,
      "CN",
      MBSTRING_ASC,
      (const unsigned char*)subjectCommon,
      -1,
      -1,
      0);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  ret = X509_REQ_set_pubkey(x509_req, pKey);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  ret = X509_REQ_sign(
      x509_req, pKey, EVP_sha256()); // returns x509_req->signature->length
  if (ret <= 0) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  {
    // Write CSR to a file
    int csrFd = open(csrFile, O_CREAT | O_WRONLY, S_IWUSR | S_IRUSR);
    if (csrFd < 0) {
      free(pKey, x509_req, bne, privateKey, csrBio);
      return -1;
    }
    FILE* csrFp = fdopen(csrFd, "w");
    if (csrFp == NULL) {
      free(pKey, x509_req, bne, privateKey, csrBio);
      return -1;
    }
    csrBio = BIO_new_fp(csrFp, BIO_CLOSE);
    ret = PEM_write_bio_X509_REQ(csrBio, x509_req);
    if (ret != 1) {
      free(pKey, x509_req, bne, privateKey, csrBio);
      return ret;
    }
  }

  ret = BIO_flush(csrBio);
  if (ret != 1) {
    free(pKey, x509_req, bne, privateKey, csrBio);
    return ret;
  }

  return (ret == 1);
}

void free(
    EVP_PKEY* pKey,
    X509_REQ* x509_req,
    BIGNUM* bne,
    BIO* privateKey,
    BIO* csrBio) {
  BN_free(bne);
  X509_REQ_free(x509_req);
  EVP_PKEY_free(pKey);
  BIO_free_all(privateKey);
  BIO_free_all(csrBio);
}
