/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/lang/SafeAssert.h>

#include <algorithm>

#include <folly/Conv.h>
#include <folly/FileUtil.h>

namespace folly {
namespace detail {

namespace {

//  script (centos):
//
//  for e in $(
//      cat /usr/include/asm*/errno*.h | awk '{print $2}' | grep -P '^E' | sort
//  ) ; do
//    echo "#if defined($e)"
//    echo "    FOLLY_DETAIL_ERROR($e),"
//    echo "#endif"
//  done

#define FOLLY_DETAIL_ERROR(name) \
  { name, #name }
constexpr std::pair<int, const char*> errors[] = {
#if defined(E2BIG)
    FOLLY_DETAIL_ERROR(E2BIG),
#endif
#if defined(EACCES)
    FOLLY_DETAIL_ERROR(EACCES),
#endif
#if defined(EADDRINUSE)
    FOLLY_DETAIL_ERROR(EADDRINUSE),
#endif
#if defined(EADDRNOTAVAIL)
    FOLLY_DETAIL_ERROR(EADDRNOTAVAIL),
#endif
#if defined(EADV)
    FOLLY_DETAIL_ERROR(EADV),
#endif
#if defined(EAFNOSUPPORT)
    FOLLY_DETAIL_ERROR(EAFNOSUPPORT),
#endif
#if defined(EAGAIN)
    FOLLY_DETAIL_ERROR(EAGAIN),
#endif
#if defined(EALREADY)
    FOLLY_DETAIL_ERROR(EALREADY),
#endif
#if defined(EBADE)
    FOLLY_DETAIL_ERROR(EBADE),
#endif
#if defined(EBADF)
    FOLLY_DETAIL_ERROR(EBADF),
#endif
#if defined(EBADFD)
    FOLLY_DETAIL_ERROR(EBADFD),
#endif
#if defined(EBADMSG)
    FOLLY_DETAIL_ERROR(EBADMSG),
#endif
#if defined(EBADR)
    FOLLY_DETAIL_ERROR(EBADR),
#endif
#if defined(EBADRQC)
    FOLLY_DETAIL_ERROR(EBADRQC),
#endif
#if defined(EBADSLT)
    FOLLY_DETAIL_ERROR(EBADSLT),
#endif
#if defined(EBFONT)
    FOLLY_DETAIL_ERROR(EBFONT),
#endif
#if defined(EBUSY)
    FOLLY_DETAIL_ERROR(EBUSY),
#endif
#if defined(ECANCELED)
    FOLLY_DETAIL_ERROR(ECANCELED),
#endif
#if defined(ECHILD)
    FOLLY_DETAIL_ERROR(ECHILD),
#endif
#if defined(ECHRNG)
    FOLLY_DETAIL_ERROR(ECHRNG),
#endif
#if defined(ECOMM)
    FOLLY_DETAIL_ERROR(ECOMM),
#endif
#if defined(ECONNABORTED)
    FOLLY_DETAIL_ERROR(ECONNABORTED),
#endif
#if defined(ECONNREFUSED)
    FOLLY_DETAIL_ERROR(ECONNREFUSED),
#endif
#if defined(ECONNRESET)
    FOLLY_DETAIL_ERROR(ECONNRESET),
#endif
#if defined(EDEADLK)
    FOLLY_DETAIL_ERROR(EDEADLK),
#endif
#if defined(EDEADLOCK)
    FOLLY_DETAIL_ERROR(EDEADLOCK),
#endif
#if defined(EDESTADDRREQ)
    FOLLY_DETAIL_ERROR(EDESTADDRREQ),
#endif
#if defined(EDOM)
    FOLLY_DETAIL_ERROR(EDOM),
#endif
#if defined(EDOTDOT)
    FOLLY_DETAIL_ERROR(EDOTDOT),
#endif
#if defined(EDQUOT)
    FOLLY_DETAIL_ERROR(EDQUOT),
#endif
#if defined(EEXIST)
    FOLLY_DETAIL_ERROR(EEXIST),
#endif
#if defined(EFAULT)
    FOLLY_DETAIL_ERROR(EFAULT),
#endif
#if defined(EFBIG)
    FOLLY_DETAIL_ERROR(EFBIG),
#endif
#if defined(EHOSTDOWN)
    FOLLY_DETAIL_ERROR(EHOSTDOWN),
#endif
#if defined(EHOSTUNREACH)
    FOLLY_DETAIL_ERROR(EHOSTUNREACH),
#endif
#if defined(EHWPOISON)
    FOLLY_DETAIL_ERROR(EHWPOISON),
#endif
#if defined(EIDRM)
    FOLLY_DETAIL_ERROR(EIDRM),
#endif
#if defined(EILSEQ)
    FOLLY_DETAIL_ERROR(EILSEQ),
#endif
#if defined(EINPROGRESS)
    FOLLY_DETAIL_ERROR(EINPROGRESS),
#endif
#if defined(EINTR)
    FOLLY_DETAIL_ERROR(EINTR),
#endif
#if defined(EINVAL)
    FOLLY_DETAIL_ERROR(EINVAL),
#endif
#if defined(EIO)
    FOLLY_DETAIL_ERROR(EIO),
#endif
#if defined(EISCONN)
    FOLLY_DETAIL_ERROR(EISCONN),
#endif
#if defined(EISDIR)
    FOLLY_DETAIL_ERROR(EISDIR),
#endif
#if defined(EISNAM)
    FOLLY_DETAIL_ERROR(EISNAM),
#endif
#if defined(EKEYEXPIRED)
    FOLLY_DETAIL_ERROR(EKEYEXPIRED),
#endif
#if defined(EKEYREJECTED)
    FOLLY_DETAIL_ERROR(EKEYREJECTED),
#endif
#if defined(EKEYREVOKED)
    FOLLY_DETAIL_ERROR(EKEYREVOKED),
#endif
#if defined(EL2HLT)
    FOLLY_DETAIL_ERROR(EL2HLT),
#endif
#if defined(EL2NSYNC)
    FOLLY_DETAIL_ERROR(EL2NSYNC),
#endif
#if defined(EL3HLT)
    FOLLY_DETAIL_ERROR(EL3HLT),
#endif
#if defined(EL3RST)
    FOLLY_DETAIL_ERROR(EL3RST),
#endif
#if defined(ELIBACC)
    FOLLY_DETAIL_ERROR(ELIBACC),
#endif
#if defined(ELIBBAD)
    FOLLY_DETAIL_ERROR(ELIBBAD),
#endif
#if defined(ELIBEXEC)
    FOLLY_DETAIL_ERROR(ELIBEXEC),
#endif
#if defined(ELIBMAX)
    FOLLY_DETAIL_ERROR(ELIBMAX),
#endif
#if defined(ELIBSCN)
    FOLLY_DETAIL_ERROR(ELIBSCN),
#endif
#if defined(ELNRNG)
    FOLLY_DETAIL_ERROR(ELNRNG),
#endif
#if defined(ELOOP)
    FOLLY_DETAIL_ERROR(ELOOP),
#endif
#if defined(EMEDIUMTYPE)
    FOLLY_DETAIL_ERROR(EMEDIUMTYPE),
#endif
#if defined(EMFILE)
    FOLLY_DETAIL_ERROR(EMFILE),
#endif
#if defined(EMLINK)
    FOLLY_DETAIL_ERROR(EMLINK),
#endif
#if defined(EMSGSIZE)
    FOLLY_DETAIL_ERROR(EMSGSIZE),
#endif
#if defined(EMULTIHOP)
    FOLLY_DETAIL_ERROR(EMULTIHOP),
#endif
#if defined(ENAMETOOLONG)
    FOLLY_DETAIL_ERROR(ENAMETOOLONG),
#endif
#if defined(ENAVAIL)
    FOLLY_DETAIL_ERROR(ENAVAIL),
#endif
#if defined(ENETDOWN)
    FOLLY_DETAIL_ERROR(ENETDOWN),
#endif
#if defined(ENETRESET)
    FOLLY_DETAIL_ERROR(ENETRESET),
#endif
#if defined(ENETUNREACH)
    FOLLY_DETAIL_ERROR(ENETUNREACH),
#endif
#if defined(ENFILE)
    FOLLY_DETAIL_ERROR(ENFILE),
#endif
#if defined(ENOANO)
    FOLLY_DETAIL_ERROR(ENOANO),
#endif
#if defined(ENOBUFS)
    FOLLY_DETAIL_ERROR(ENOBUFS),
#endif
#if defined(ENOCSI)
    FOLLY_DETAIL_ERROR(ENOCSI),
#endif
#if defined(ENODATA)
    FOLLY_DETAIL_ERROR(ENODATA),
#endif
#if defined(ENODEV)
    FOLLY_DETAIL_ERROR(ENODEV),
#endif
#if defined(ENOENT)
    FOLLY_DETAIL_ERROR(ENOENT),
#endif
#if defined(ENOEXEC)
    FOLLY_DETAIL_ERROR(ENOEXEC),
#endif
#if defined(ENOKEY)
    FOLLY_DETAIL_ERROR(ENOKEY),
#endif
#if defined(ENOLCK)
    FOLLY_DETAIL_ERROR(ENOLCK),
#endif
#if defined(ENOLINK)
    FOLLY_DETAIL_ERROR(ENOLINK),
#endif
#if defined(ENOMEDIUM)
    FOLLY_DETAIL_ERROR(ENOMEDIUM),
#endif
#if defined(ENOMEM)
    FOLLY_DETAIL_ERROR(ENOMEM),
#endif
#if defined(ENOMSG)
    FOLLY_DETAIL_ERROR(ENOMSG),
#endif
#if defined(ENONET)
    FOLLY_DETAIL_ERROR(ENONET),
#endif
#if defined(ENOPKG)
    FOLLY_DETAIL_ERROR(ENOPKG),
#endif
#if defined(ENOPROTOOPT)
    FOLLY_DETAIL_ERROR(ENOPROTOOPT),
#endif
#if defined(ENOSPC)
    FOLLY_DETAIL_ERROR(ENOSPC),
#endif
#if defined(ENOSR)
    FOLLY_DETAIL_ERROR(ENOSR),
#endif
#if defined(ENOSTR)
    FOLLY_DETAIL_ERROR(ENOSTR),
#endif
#if defined(ENOSYS)
    FOLLY_DETAIL_ERROR(ENOSYS),
#endif
#if defined(ENOTBLK)
    FOLLY_DETAIL_ERROR(ENOTBLK),
#endif
#if defined(ENOTCONN)
    FOLLY_DETAIL_ERROR(ENOTCONN),
#endif
#if defined(ENOTDIR)
    FOLLY_DETAIL_ERROR(ENOTDIR),
#endif
#if defined(ENOTEMPTY)
    FOLLY_DETAIL_ERROR(ENOTEMPTY),
#endif
#if defined(ENOTNAM)
    FOLLY_DETAIL_ERROR(ENOTNAM),
#endif
#if defined(ENOTRECOVERABLE)
    FOLLY_DETAIL_ERROR(ENOTRECOVERABLE),
#endif
#if defined(ENOTSOCK)
    FOLLY_DETAIL_ERROR(ENOTSOCK),
#endif
#if defined(ENOTTY)
    FOLLY_DETAIL_ERROR(ENOTTY),
#endif
#if defined(ENOTUNIQ)
    FOLLY_DETAIL_ERROR(ENOTUNIQ),
#endif
#if defined(ENXIO)
    FOLLY_DETAIL_ERROR(ENXIO),
#endif
#if defined(EOPNOTSUPP)
    FOLLY_DETAIL_ERROR(EOPNOTSUPP),
#endif
#if defined(EOVERFLOW)
    FOLLY_DETAIL_ERROR(EOVERFLOW),
#endif
#if defined(EOWNERDEAD)
    FOLLY_DETAIL_ERROR(EOWNERDEAD),
#endif
#if defined(EPERM)
    FOLLY_DETAIL_ERROR(EPERM),
#endif
#if defined(EPFNOSUPPORT)
    FOLLY_DETAIL_ERROR(EPFNOSUPPORT),
#endif
#if defined(EPIPE)
    FOLLY_DETAIL_ERROR(EPIPE),
#endif
#if defined(EPROTO)
    FOLLY_DETAIL_ERROR(EPROTO),
#endif
#if defined(EPROTONOSUPPORT)
    FOLLY_DETAIL_ERROR(EPROTONOSUPPORT),
#endif
#if defined(EPROTOTYPE)
    FOLLY_DETAIL_ERROR(EPROTOTYPE),
#endif
#if defined(ERANGE)
    FOLLY_DETAIL_ERROR(ERANGE),
#endif
#if defined(EREMCHG)
    FOLLY_DETAIL_ERROR(EREMCHG),
#endif
#if defined(EREMOTE)
    FOLLY_DETAIL_ERROR(EREMOTE),
#endif
#if defined(EREMOTEIO)
    FOLLY_DETAIL_ERROR(EREMOTEIO),
#endif
#if defined(ERESTART)
    FOLLY_DETAIL_ERROR(ERESTART),
#endif
#if defined(ERFKILL)
    FOLLY_DETAIL_ERROR(ERFKILL),
#endif
#if defined(EROFS)
    FOLLY_DETAIL_ERROR(EROFS),
#endif
#if defined(ESHUTDOWN)
    FOLLY_DETAIL_ERROR(ESHUTDOWN),
#endif
#if defined(ESOCKTNOSUPPORT)
    FOLLY_DETAIL_ERROR(ESOCKTNOSUPPORT),
#endif
#if defined(ESPIPE)
    FOLLY_DETAIL_ERROR(ESPIPE),
#endif
#if defined(ESRCH)
    FOLLY_DETAIL_ERROR(ESRCH),
#endif
#if defined(ESRMNT)
    FOLLY_DETAIL_ERROR(ESRMNT),
#endif
#if defined(ESTALE)
    FOLLY_DETAIL_ERROR(ESTALE),
#endif
#if defined(ESTRPIPE)
    FOLLY_DETAIL_ERROR(ESTRPIPE),
#endif
#if defined(ETIME)
    FOLLY_DETAIL_ERROR(ETIME),
#endif
#if defined(ETIMEDOUT)
    FOLLY_DETAIL_ERROR(ETIMEDOUT),
#endif
#if defined(ETOOMANYREFS)
    FOLLY_DETAIL_ERROR(ETOOMANYREFS),
#endif
#if defined(ETXTBSY)
    FOLLY_DETAIL_ERROR(ETXTBSY),
#endif
#if defined(EUCLEAN)
    FOLLY_DETAIL_ERROR(EUCLEAN),
#endif
#if defined(EUNATCH)
    FOLLY_DETAIL_ERROR(EUNATCH),
#endif
#if defined(EUSERS)
    FOLLY_DETAIL_ERROR(EUSERS),
#endif
#if defined(EWOULDBLOCK)
    FOLLY_DETAIL_ERROR(EWOULDBLOCK),
#endif
#if defined(EXDEV)
    FOLLY_DETAIL_ERROR(EXDEV),
#endif
#if defined(EXFULL)
    FOLLY_DETAIL_ERROR(EXFULL),
#endif
};
#undef FOLLY_DETAIL_ERROR

void writeStderr(const char* s, size_t len) {
  writeFull(STDERR_FILENO, s, len);
}
void writeStderr(const char* s) {
  writeStderr(s, strlen(s));
}

} // namespace

void assertionFailure(
    const char* expr,
    const char* msg,
    const char* file,
    unsigned int line,
    const char* function,
    int error) {
  writeStderr("\n\nAssertion failure: ");
  writeStderr(expr + 1, strlen(expr) - 2);
  writeStderr("\nMessage: ");
  writeStderr(msg);
  writeStderr("\nFile: ");
  writeStderr(file);
  writeStderr("\nLine: ");
  char buf[20];
  uint32_t n = uint64ToBufferUnsafe(line, buf);
  writeFull(STDERR_FILENO, buf, n);
  writeStderr("\nFunction: ");
  writeStderr(function);
  if (error) {
    // if errno is set, print the number and the symbolic constant
    // the symbolic constant is necessary since actual numbers may vary
    // for simplicity, do not attempt to mimic strerror printing descriptions
    writeStderr("\nError: ");
    n = uint64ToBufferUnsafe(error, buf);
    writeFull(STDERR_FILENO, buf, n);
    writeStderr(" (");
    // the list is not required to be sorted; but the program is about to die
    auto const pred = [=](auto const e) { return e.first == error; };
    auto const it = std::find_if(std::begin(errors), std::end(errors), pred);
    writeStderr(it != std::end(errors) ? it->second : "<unknown>");
    writeStderr(")");
  }
  writeStderr("\n");
  fsyncNoInt(STDERR_FILENO);
  abort();
}

} // namespace detail
} // namespace folly
