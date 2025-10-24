#include <stdio.h>
#include <syslog.h>

// Forward declare the Swift function
extern void screen_inspector_dylib_init(void);

__attribute__((constructor))
static void customConstructor(int argc, const char **argv)
 {
     syslog(LOG_ERR, "[ScreenInspector] Dylib injection successful in %s\n", argv[0]);

     // Call Swift initialization directly
     screen_inspector_dylib_init();
}
