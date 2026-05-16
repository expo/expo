// Forward declare the Swift function
extern void screen_inspector_dylib_init(void);

__attribute__((constructor))
static void customConstructor(int argc, const char **argv)
{
    screen_inspector_dylib_init();
}
