//
// ssl/old/basic_context.hpp
// ~~~~~~~~~~~~~~~~~~~~~~~~~
//
// Copyright (c) 2005 Voipster / Indrek dot Juhani at voipster dot com
// Copyright (c) 2005-2016 Christopher M. Kohlhoff (chris at kohlhoff dot com)
//
// Distributed under the Boost Software License, Version 1.0. (See accompanying
// file LICENSE_1_0.txt or copy at http://www.boost.org/LICENSE_1_0.txt)
//

#ifndef BOOST_ASIO_SSL_OLD_BASIC_CONTEXT_HPP
#define BOOST_ASIO_SSL_OLD_BASIC_CONTEXT_HPP

#if defined(_MSC_VER) && (_MSC_VER >= 1200)
# pragma once
#endif // defined(_MSC_VER) && (_MSC_VER >= 1200)

#include <boost/asio/detail/config.hpp>
#include <string>
#include <boost/noncopyable.hpp>
#include <boost/asio/detail/throw_error.hpp>
#include <boost/asio/error.hpp>
#include <boost/asio/io_service.hpp>
#include <boost/asio/ssl/context_base.hpp>

#include <boost/asio/detail/push_options.hpp>

namespace boost {
namespace asio {
namespace ssl {
namespace old {

/// SSL context.
template <typename Service>
class basic_context
  : public context_base,
    private boost::noncopyable
{
public:
  /// The type of the service that will be used to provide context operations.
  typedef Service service_type;

  /// The native implementation type of the SSL context.
  typedef typename service_type::impl_type impl_type;

  /// Constructor.
  basic_context(boost::asio::io_service& io_service, method m)
    : service_(boost::asio::use_service<Service>(io_service)),
      impl_(service_.null())
  {
    service_.create(impl_, m);
  }

  /// Destructor.
  ~basic_context()
  {
    service_.destroy(impl_);
  }

  /// Get the underlying implementation in the native type.
  /**
   * This function may be used to obtain the underlying implementation of the
   * context. This is intended to allow access to context functionality that is
   * not otherwise provided.
   */
  impl_type impl()
  {
    return impl_;
  }

  /// Set options on the context.
  /**
   * This function may be used to configure the SSL options used by the context.
   *
   * @param o A bitmask of options. The available option values are defined in
   * the context_base class. The options are bitwise-ored with any existing
   * value for the options.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void set_options(options o)
  {
    boost::system::error_code ec;
    service_.set_options(impl_, o, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Set options on the context.
  /**
   * This function may be used to configure the SSL options used by the context.
   *
   * @param o A bitmask of options. The available option values are defined in
   * the context_base class. The options are bitwise-ored with any existing
   * value for the options.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code set_options(options o,
      boost::system::error_code& ec)
  {
    return service_.set_options(impl_, o, ec);
  }

  /// Set the peer verification mode.
  /**
   * This function may be used to configure the peer verification mode used by
   * the context.
   *
   * @param v A bitmask of peer verification modes. The available verify_mode
   * values are defined in the context_base class.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void set_verify_mode(verify_mode v)
  {
    boost::system::error_code ec;
    service_.set_verify_mode(impl_, v, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Set the peer verification mode.
  /**
   * This function may be used to configure the peer verification mode used by
   * the context.
   *
   * @param v A bitmask of peer verification modes. The available verify_mode
   * values are defined in the context_base class.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code set_verify_mode(verify_mode v,
      boost::system::error_code& ec)
  {
    return service_.set_verify_mode(impl_, v, ec);
  }

  /// Load a certification authority file for performing verification.
  /**
   * This function is used to load one or more trusted certification authorities
   * from a file.
   *
   * @param filename The name of a file containing certification authority
   * certificates in PEM format.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void load_verify_file(const std::string& filename)
  {
    boost::system::error_code ec;
    service_.load_verify_file(impl_, filename, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Load a certification authority file for performing verification.
  /**
   * This function is used to load the certificates for one or more trusted
   * certification authorities from a file.
   *
   * @param filename The name of a file containing certification authority
   * certificates in PEM format.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code load_verify_file(const std::string& filename,
      boost::system::error_code& ec)
  {
    return service_.load_verify_file(impl_, filename, ec);
  }

  /// Add a directory containing certificate authority files to be used for
  /// performing verification.
  /**
   * This function is used to specify the name of a directory containing
   * certification authority certificates. Each file in the directory must
   * contain a single certificate. The files must be named using the subject
   * name's hash and an extension of ".0".
   *
   * @param path The name of a directory containing the certificates.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void add_verify_path(const std::string& path)
  {
    boost::system::error_code ec;
    service_.add_verify_path(impl_, path, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Add a directory containing certificate authority files to be used for
  /// performing verification.
  /**
   * This function is used to specify the name of a directory containing
   * certification authority certificates. Each file in the directory must
   * contain a single certificate. The files must be named using the subject
   * name's hash and an extension of ".0".
   *
   * @param path The name of a directory containing the certificates.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code add_verify_path(const std::string& path,
      boost::system::error_code& ec)
  {
    return service_.add_verify_path(impl_, path, ec);
  }

  /// Use a certificate from a file.
  /**
   * This function is used to load a certificate into the context from a file.
   *
   * @param filename The name of the file containing the certificate.
   *
   * @param format The file format (ASN.1 or PEM).
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void use_certificate_file(const std::string& filename, file_format format)
  {
    boost::system::error_code ec;
    service_.use_certificate_file(impl_, filename, format, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Use a certificate from a file.
  /**
   * This function is used to load a certificate into the context from a file.
   *
   * @param filename The name of the file containing the certificate.
   *
   * @param format The file format (ASN.1 or PEM).
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code use_certificate_file(const std::string& filename,
      file_format format, boost::system::error_code& ec)
  {
    return service_.use_certificate_file(impl_, filename, format, ec);
  }

  /// Use a certificate chain from a file.
  /**
   * This function is used to load a certificate chain into the context from a
   * file.
   *
   * @param filename The name of the file containing the certificate. The file
   * must use the PEM format.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void use_certificate_chain_file(const std::string& filename)
  {
    boost::system::error_code ec;
    service_.use_certificate_chain_file(impl_, filename, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Use a certificate chain from a file.
  /**
   * This function is used to load a certificate chain into the context from a
   * file.
   *
   * @param filename The name of the file containing the certificate. The file
   * must use the PEM format.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code use_certificate_chain_file(
      const std::string& filename, boost::system::error_code& ec)
  {
    return service_.use_certificate_chain_file(impl_, filename, ec);
  }

  /// Use a private key from a file.
  /**
   * This function is used to load a private key into the context from a file.
   *
   * @param filename The name of the file containing the private key.
   *
   * @param format The file format (ASN.1 or PEM).
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void use_private_key_file(const std::string& filename, file_format format)
  {
    boost::system::error_code ec;
    service_.use_private_key_file(impl_, filename, format, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Use a private key from a file.
  /**
   * This function is used to load a private key into the context from a file.
   *
   * @param filename The name of the file containing the private key.
   *
   * @param format The file format (ASN.1 or PEM).
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code use_private_key_file(const std::string& filename,
      file_format format, boost::system::error_code& ec)
  {
    return service_.use_private_key_file(impl_, filename, format, ec);
  }

  /// Use an RSA private key from a file.
  /**
   * This function is used to load an RSA private key into the context from a
   * file.
   *
   * @param filename The name of the file containing the RSA private key.
   *
   * @param format The file format (ASN.1 or PEM).
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void use_rsa_private_key_file(const std::string& filename, file_format format)
  {
    boost::system::error_code ec;
    service_.use_rsa_private_key_file(impl_, filename, format, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Use an RSA private key from a file.
  /**
   * This function is used to load an RSA private key into the context from a
   * file.
   *
   * @param filename The name of the file containing the RSA private key.
   *
   * @param format The file format (ASN.1 or PEM).
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code use_rsa_private_key_file(
      const std::string& filename, file_format format,
      boost::system::error_code& ec)
  {
    return service_.use_rsa_private_key_file(impl_, filename, format, ec);
  }

  /// Use the specified file to obtain the temporary Diffie-Hellman parameters.
  /**
   * This function is used to load Diffie-Hellman parameters into the context
   * from a file.
   *
   * @param filename The name of the file containing the Diffie-Hellman
   * parameters. The file must use the PEM format.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  void use_tmp_dh_file(const std::string& filename)
  {
    boost::system::error_code ec;
    service_.use_tmp_dh_file(impl_, filename, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Use the specified file to obtain the temporary Diffie-Hellman parameters.
  /**
   * This function is used to load Diffie-Hellman parameters into the context
   * from a file.
   *
   * @param filename The name of the file containing the Diffie-Hellman
   * parameters. The file must use the PEM format.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  boost::system::error_code use_tmp_dh_file(const std::string& filename,
      boost::system::error_code& ec)
  {
    return service_.use_tmp_dh_file(impl_, filename, ec);
  }

  /// Set the password callback.
  /**
   * This function is used to specify a callback function to obtain password
   * information about an encrypted key in PEM format.
   *
   * @param callback The function object to be used for obtaining the password.
   * The function signature of the handler must be:
   * @code std::string password_callback(
   *   std::size_t max_length,  // The maximum size for a password.
   *   password_purpose purpose // Whether password is for reading or writing.
   * ); @endcode
   * The return value of the callback is a string containing the password.
   *
   * @throws boost::system::system_error Thrown on failure.
   */
  template <typename PasswordCallback>
  void set_password_callback(PasswordCallback callback)
  {
    boost::system::error_code ec;
    service_.set_password_callback(impl_, callback, ec);
    boost::asio::detail::throw_error(ec);
  }

  /// Set the password callback.
  /**
   * This function is used to specify a callback function to obtain password
   * information about an encrypted key in PEM format.
   *
   * @param callback The function object to be used for obtaining the password.
   * The function signature of the handler must be:
   * @code std::string password_callback(
   *   std::size_t max_length,  // The maximum size for a password.
   *   password_purpose purpose // Whether password is for reading or writing.
   * ); @endcode
   * The return value of the callback is a string containing the password.
   *
   * @param ec Set to indicate what error occurred, if any.
   */
  template <typename PasswordCallback>
  boost::system::error_code set_password_callback(PasswordCallback callback,
      boost::system::error_code& ec)
  {
    return service_.set_password_callback(impl_, callback, ec);
  }

private:
  /// The backend service implementation.
  service_type& service_;

  /// The underlying native implementation.
  impl_type impl_;
};

} // namespace old
} // namespace ssl
} // namespace asio
} // namespace boost

#include <boost/asio/detail/pop_options.hpp>

#endif // BOOST_ASIO_SSL_OLD_BASIC_CONTEXT_HPP
