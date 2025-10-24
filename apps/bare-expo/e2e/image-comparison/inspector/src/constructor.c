#include <stdio.h>
#include <syslog.h>

// Forward declare the Swift function
extern void screen_inspector_dylib_init(void);

// C function to write to syslog that Swift can call
// these logs are visible via Console.app
void c_syslog(const char* message) {
    syslog(LOG_ERR, "%s", message);
}

__attribute__((constructor))
static void customConstructor(int argc, const char **argv)
 {
     syslog(LOG_ERR, "[ScreenInspector] Dylib injection successful in %s\n", argv[0]);

     // Call Swift initialization directly
     screen_inspector_dylib_init();
}
