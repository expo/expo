// Copyright (C) 2006 Douglas Gregor <doug.gregor -at- gmail.com>.

// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

/** @file request.hpp
 *
 *  This header defines the class @c request, which contains a request
 *  for non-blocking communication.
 */
#ifndef BOOST_MPI_REQUEST_HPP
#define BOOST_MPI_REQUEST_HPP

#include <boost/mpi/config.hpp>
#include <boost/optional.hpp>
#include <boost/shared_ptr.hpp>
#include <boost/mpi/packed_iarchive.hpp>

namespace boost { namespace mpi {

class status;
class communicator;

/**
 *  @brief A request for a non-blocking send or receive.
 *
 *  This structure contains information about a non-blocking send or
 *  receive and will be returned from @c isend or @c irecv,
 *  respectively.
 */
class BOOST_MPI_DECL request 
{
 public:
  /**
   *  Constructs a NULL request.
   */
  request();

  /**
   *  Wait until the communication associated with this request has
   *  completed, then return a @c status object describing the
   *  communication.
   */
  status wait();

  /**
   *  Determine whether the communication associated with this request
   *  has completed successfully. If so, returns the @c status object
   *  describing the communication. Otherwise, returns an empty @c
   *  optional<> to indicate that the communication has not completed
   *  yet. Note that once @c test() returns a @c status object, the
   *  request has completed and @c wait() should not be called.
   */
  optional<status> test();

  /**
   *  Cancel a pending communication, assuming it has not already been
   *  completed.
   */
  void cancel();

 private:
  enum request_action { ra_wait, ra_test, ra_cancel };
  typedef optional<status> (*handler_type)(request* self, 
                                           request_action action);

  /**
   * INTERNAL ONLY
   *
   * Handles the non-blocking receive of a serialized value.
   */
  template<typename T>
  static optional<status> 
  handle_serialized_irecv(request* self, request_action action);

  /**
   * INTERNAL ONLY
   *
   * Handles the non-blocking receive of an array of  serialized values.
   */
  template<typename T>
  static optional<status> 
  handle_serialized_array_irecv(request* self, request_action action);

 public: // template friends are not portable

  /// INTERNAL ONLY
  MPI_Request m_requests[2];

  /// INTERNAL ONLY
  handler_type m_handler;

  /// INTERNAL ONLY
  shared_ptr<void> m_data;

  friend class communicator;
};

} } // end namespace boost::mpi

#endif // BOOST_MPI_REQUEST_HPP
