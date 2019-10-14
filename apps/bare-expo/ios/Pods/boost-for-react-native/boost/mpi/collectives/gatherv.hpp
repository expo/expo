// Copyright (C) 2011 Júlio Hoffimann.

// Use, modification and distribution is subject to the Boost Software
// License, Version 1.0. (See accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)

// Message Passing Interface 1.1 -- Section 4.5. Gatherv
#ifndef BOOST_MPI_GATHERV_HPP
#define BOOST_MPI_GATHERV_HPP

#include <boost/mpi/exception.hpp>
#include <boost/mpi/datatype.hpp>
#include <vector>
#include <boost/mpi/packed_oarchive.hpp>
#include <boost/mpi/packed_iarchive.hpp>
#include <boost/mpi/detail/point_to_point.hpp>
#include <boost/mpi/communicator.hpp>
#include <boost/mpi/environment.hpp>
#include <boost/assert.hpp>

namespace boost { namespace mpi {

namespace detail {
  // We're gathering at the root for a type that has an associated MPI
  // datatype, so we'll use MPI_Gatherv to do all of the work.
  template<typename T>
  void
  gatherv_impl(const communicator& comm, const T* in_values, int in_size, 
               T* out_values, const int* sizes, const int* displs, int root, mpl::true_)
  {
    MPI_Datatype type = get_mpi_datatype<T>(*in_values);
    BOOST_MPI_CHECK_RESULT(MPI_Gatherv,
                           (const_cast<T*>(in_values), in_size, type,
                            out_values, const_cast<int*>(sizes), const_cast<int*>(displs),
                            type, root, comm));
  }

  // We're gathering from a non-root for a type that has an associated MPI
  // datatype, so we'll use MPI_Gatherv to do all of the work.
  template<typename T>
  void
  gatherv_impl(const communicator& comm, const T* in_values, int in_size, int root, 
              mpl::true_)
  {
    MPI_Datatype type = get_mpi_datatype<T>(*in_values);
    BOOST_MPI_CHECK_RESULT(MPI_Gatherv,
                           (const_cast<T*>(in_values), in_size, type,
                            0, 0, 0, type, root, comm));
  }

  // We're gathering at the root for a type that does not have an
  // associated MPI datatype, so we'll need to serialize
  // it. Unfortunately, this means that we cannot use MPI_Gatherv, so
  // we'll just have all of the non-root nodes send individual
  // messages to the root.
  template<typename T>
  void
  gatherv_impl(const communicator& comm, const T* in_values, int in_size, 
               T* out_values, const int* sizes, const int* displs, int root, mpl::false_)
  {
    int tag = environment::collectives_tag();
    int nprocs = comm.size();

    for (int src = 0; src < nprocs; ++src) {
      if (src == root)
        // Our own values will never be transmitted: just copy them.
        std::copy(in_values, in_values + in_size, out_values + displs[src]);
      else {
//        comm.recv(src, tag, out_values + displs[src], sizes[src]);
        // Receive archive
        packed_iarchive ia(comm);
        MPI_Status status;
        detail::packed_archive_recv(comm, src, tag, ia, status);
        for (int i = 0; i < sizes[src]; ++i)
          ia >> out_values[ displs[src] + i ];
      }
    }
  }

  // We're gathering at a non-root for a type that does not have an
  // associated MPI datatype, so we'll need to serialize
  // it. Unfortunately, this means that we cannot use MPI_Gatherv, so
  // we'll just have all of the non-root nodes send individual
  // messages to the root.
  template<typename T>
  void
  gatherv_impl(const communicator& comm, const T* in_values, int in_size, int root, 
              mpl::false_)
  {
    int tag = environment::collectives_tag();
//    comm.send(root, tag, in_values, in_size);
    packed_oarchive oa(comm);
    for (int i = 0; i < in_size; ++i)
      oa << in_values[i];
    detail::packed_archive_send(comm, root, tag, oa);
  }
} // end namespace detail

template<typename T>
void
gatherv(const communicator& comm, const T* in_values, int in_size,
        T* out_values, const std::vector<int>& sizes, const std::vector<int>& displs,
        int root)
{
  if (comm.rank() == root)
    detail::gatherv_impl(comm, in_values, in_size,
                         out_values, &sizes[0], &displs[0],
                         root, is_mpi_datatype<T>());
  else
    detail::gatherv_impl(comm, in_values, in_size, root, is_mpi_datatype<T>());
}

template<typename T>
void
gatherv(const communicator& comm, const std::vector<T>& in_values,
        T* out_values, const std::vector<int>& sizes, const std::vector<int>& displs,
        int root)
{
  ::boost::mpi::gatherv(comm, &in_values[0], in_values.size(), out_values, sizes, displs, root);
}

template<typename T>
void gatherv(const communicator& comm, const T* in_values, int in_size, int root)
{
  BOOST_ASSERT(comm.rank() != root);
  detail::gatherv_impl(comm, in_values, in_size, root, is_mpi_datatype<T>());
}

template<typename T>
void gatherv(const communicator& comm, const std::vector<T>& in_values, int root)
{
  BOOST_ASSERT(comm.rank() != root);
  detail::gatherv_impl(comm, &in_values[0], in_values.size(), root, is_mpi_datatype<T>());
}

///////////////////////
// common use versions
///////////////////////
template<typename T>
void
gatherv(const communicator& comm, const T* in_values, int in_size,
        T* out_values, const std::vector<int>& sizes, int root)
{
  int nprocs = comm.size();

  std::vector<int> displs( nprocs );
  for (int rank = 0, aux = 0; rank < nprocs; ++rank) {
    displs[rank] = aux;
    aux += sizes[rank];
  }
  ::boost::mpi::gatherv(comm, in_values, in_size, out_values, sizes, displs, root);
}

template<typename T>
void
gatherv(const communicator& comm, const std::vector<T>& in_values,
        T* out_values, const std::vector<int>& sizes, int root)
{
  ::boost::mpi::gatherv(comm, &in_values[0], in_values.size(), out_values, sizes, root);
}

} } // end namespace boost::mpi

#endif // BOOST_MPI_GATHERV_HPP
