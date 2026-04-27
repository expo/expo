#!/bin/bash
set -eEuo pipefail

DEVICE_SERIAL="3f8857e9"
PACKAGE="dev.expo.payments"
COLD_TIMEOUT=30
ANIMATION_FRAMES_REQUIRED=2
TRACE_DEVICE_PATH="/data/misc/perfetto-traces/trace.perfetto-trace"
SIMPLEPERF_DEVICE_PATH="/data/local/tmp/perf.data"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
TRACE_LOCAL_DIR="./traces"
TRACE_LOCAL_FILE="$TRACE_LOCAL_DIR/trace_${TIMESTAMP}.perfetto-trace"
SIMPLEPERF_LOCAL_FILE="$TRACE_LOCAL_DIR/perf_${TIMESTAMP}.data"
LOGCAT_TMP="/tmp/perfetto_bench_logcat_$$.log"

LOGCAT_BG_PID=""
SIMPLEPERF_BG_PID=""
PERFETTO_KEY=$$

adb_cmd() {
    adb -s "$DEVICE_SERIAL" "$@"
}

log_info() {
    echo "[INFO] $*"
}

log_error() {
    echo "[ERROR] $*" >&2
}

cleanup() {
    log_info "Cleaning up..."
    if [ -n "$LOGCAT_BG_PID" ]; then
        kill "$LOGCAT_BG_PID" 2>/dev/null || true
        wait "$LOGCAT_BG_PID" 2>/dev/null || true
    fi
    adb_cmd shell pkill -INT simpleperf 2>/dev/null || true
    if [ -n "$SIMPLEPERF_BG_PID" ]; then
        wait "$SIMPLEPERF_BG_PID" 2>/dev/null || true
    fi
    adb_cmd shell perfetto --attach="$PERFETTO_KEY" --stop 2>/dev/null || true
    adb_cmd shell am force-stop "$PACKAGE" 2>/dev/null || true
    rm -f "$LOGCAT_TMP"
}

on_error() {
    log_error "Script failed at line $1 (command: $2)"
}

trap 'on_error $LINENO "$BASH_COMMAND"' ERR
trap cleanup EXIT INT TERM

PERFETTO_CONFIG='
buffers {
    size_kb: 131072
    fill_policy: RING_BUFFER
}

data_sources {
    config {
        name: "linux.ftrace"
        ftrace_config {
            ftrace_events: "sched/sched_switch"
            ftrace_events: "sched/sched_waking"
            ftrace_events: "sched/sched_blocked_reason"
            ftrace_events: "power/suspend_resume"
            ftrace_events: "power/cpu_frequency"
            ftrace_events: "power/cpu_idle"
            ftrace_events: "binder/binder_transaction"
            ftrace_events: "binder/binder_transaction_received"
            ftrace_events: "binder/binder_lock"
            ftrace_events: "binder/binder_locked"
            ftrace_events: "binder/binder_unlock"
            atrace_categories: "am"
            atrace_categories: "wm"
            atrace_categories: "view"
            atrace_categories: "gfx"
            atrace_categories: "input"
            atrace_categories: "dalvik"
            atrace_categories: "binder_driver"
            atrace_categories: "res"
            atrace_categories: "hal"
            atrace_apps: "dev.expo.payments"
        }
    }
}

data_sources {
    config {
        name: "linux.process_stats"
        process_stats_config {
            scan_all_processes_on_start: true
            proc_stats_poll_ms: 100
        }
    }
}

data_sources {
    config {
        name: "linux.sys_stats"
        sys_stats_config {
            meminfo_period_ms: 500
            stat_period_ms: 500
        }
    }
}

write_into_file: true
duration_ms: 60000
'

wait_for_animation_frames() {
    local logcat_file="$1"
    local timeout="$2"
    local start_time
    start_time=$(date +%s)

    while true; do
        local now
        now=$(date +%s)
        local elapsed=$(( now - start_time ))

        if [ "$elapsed" -ge "$timeout" ]; then
            return 1
        fi

        local frame_count
        frame_count=$(grep -c "name=animationFrame" "$logcat_file" 2>/dev/null || true)
        frame_count="${frame_count//[^0-9]/}"
        frame_count="${frame_count:-0}"

        if [ "$frame_count" -ge "$ANIMATION_FRAMES_REQUIRED" ]; then
            return 0
        fi

        sleep 0.3
    done
}

validate_environment() {
    log_info "Validating environment..."

    if ! command -v adb &>/dev/null; then
        log_error "adb not found in PATH"
        exit 1
    fi

    if ! adb_cmd shell echo ok &>/dev/null; then
        log_error "Device $DEVICE_SERIAL not responding"
        exit 1
    fi

    log_info "Environment OK"
}

main() {
    validate_environment

    mkdir -p "$TRACE_LOCAL_DIR"

    log_info "Force-stopping $PACKAGE..."
    adb_cmd shell am force-stop "$PACKAGE"
    sleep 1
    adb_cmd logcat -c
    sleep 0.2

    log_info "Starting Perfetto trace..."
    adb_cmd shell "echo '${PERFETTO_CONFIG}' | perfetto --txt -c - -o $TRACE_DEVICE_PATH --detach=$PERFETTO_KEY"

    log_info "Starting simpleperf recording..."
    adb -s "$DEVICE_SERIAL" shell simpleperf record \
        --app "$PACKAGE" \
        -o "$SIMPLEPERF_DEVICE_PATH" \
        -g \
        -f 4000 \
        --user-buffer-size 512M \
        --duration 60 \
        </dev/null >/tmp/simpleperf_$$.log 2>&1 &
    SIMPLEPERF_BG_PID=$!
    sleep 2

    adb -s "$DEVICE_SERIAL" logcat > "$LOGCAT_TMP" 2>&1 &
    LOGCAT_BG_PID=$!

    log_info "Launching $PACKAGE..."
    adb_cmd shell monkey -p "$PACKAGE" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1

    log_info "Waiting for 2 animation frames (timeout: ${COLD_TIMEOUT}s)..."
    if wait_for_animation_frames "$LOGCAT_TMP" "$COLD_TIMEOUT"; then
        log_info "Detected 2 animation frames. Stopping trace..."
    else
        log_error "Timed out waiting for animation frames. Stopping trace anyway..."
    fi

    kill "$LOGCAT_BG_PID" 2>/dev/null || true
    wait "$LOGCAT_BG_PID" 2>/dev/null || true
    LOGCAT_BG_PID=""

    log_info "Stopping simpleperf..."
    adb_cmd shell pkill -INT simpleperf 2>/dev/null || true
    if [ -n "$SIMPLEPERF_BG_PID" ]; then
        wait "$SIMPLEPERF_BG_PID" 2>/dev/null || true
        SIMPLEPERF_BG_PID=""
    fi
    sleep 3
    log_info "Simpleperf log:"
    cat /tmp/simpleperf_$$.log 2>/dev/null || true

    log_info "Stopping Perfetto..."
    adb_cmd shell perfetto --attach="$PERFETTO_KEY" --stop
    sleep 2

    log_info "Pulling Perfetto trace to $TRACE_LOCAL_FILE..."
    if adb_cmd pull "$TRACE_DEVICE_PATH" "$TRACE_LOCAL_FILE"; then
        log_info "Perfetto trace saved to: $TRACE_LOCAL_FILE"
    else
        log_error "Failed to pull Perfetto trace file"
    fi

    log_info "Pulling simpleperf data to $SIMPLEPERF_LOCAL_FILE..."
    if adb_cmd pull "$SIMPLEPERF_DEVICE_PATH" "$SIMPLEPERF_LOCAL_FILE"; then
        log_info "Simpleperf data saved to: $SIMPLEPERF_LOCAL_FILE"
        log_info "Generate flame chart with: simpleperf report-sample --protobuf --show-callchain -i $SIMPLEPERF_LOCAL_FILE -o ${SIMPLEPERF_LOCAL_FILE%.data}.pftrace"
        log_info "Or use: https://ui.perfetto.dev (drag the .data file directly)"
    else
        log_error "Failed to pull simpleperf data"
    fi

    log_info "Captured metrics:"
    grep "category=appStartup" "$LOGCAT_TMP" 2>/dev/null | grep "Metrics" || true

    adb_cmd shell rm -f "$TRACE_DEVICE_PATH" "$SIMPLEPERF_DEVICE_PATH" 2>/dev/null || true
    rm -f "$LOGCAT_TMP"
    LOGCAT_TMP=""

    log_info "Done."
}

main
