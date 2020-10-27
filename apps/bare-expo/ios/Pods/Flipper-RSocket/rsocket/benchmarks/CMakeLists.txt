add_library(fixture Fixture.cpp Fixture.h)
target_link_libraries(fixture ReactiveSocket Folly::folly)

function(benchmark NAME FILE)
  add_executable(${NAME} ${FILE} Benchmarks.cpp)
  target_link_libraries(
    ${NAME}
    fixture
    ReactiveSocket
    Folly::follybenchmark
    glog::glog
    gflags)
endfunction()

benchmark(baselines_tcp BaselinesTcp.cpp)
benchmark(baselines_async_socket BaselinesAsyncSocket.cpp)

benchmark(fire-forget-throughput-tcp FireForgetThroughputTcp.cpp)
benchmark(req-response-throughput-tcp RequestResponseThroughputTcp.cpp)
benchmark(stream-throughput-tcp StreamThroughputTcp.cpp)

benchmark(stream-throughput-mem StreamThroughputMemory.cpp)

add_test(NAME RequestResponseThroughputTcpTest COMMAND req-response-throughput-tcp --items 100000)
add_test(NAME StreamThroughputTcpTest COMMAND stream-throughput-tcp --items 100000)
add_test(NAME FireForgetThroughputTcpTest COMMAND fire-forget-throughput-tcp --items 100000)

#TODO(lehecka):enable test
#add_test(NAME StreamThroughputMemoryTest COMMAND stream-throughput-mem --items 100000)
