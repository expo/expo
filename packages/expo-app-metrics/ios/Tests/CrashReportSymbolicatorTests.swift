import Testing

@testable import ExpoAppMetrics

@Suite("CrashReportSymbolicator")
struct CrashReportSymbolicatorTests {
  @Suite("demangle")
  struct DemangleTests {
    @Test
    func `demangles a Swift symbol`() {
      // Mangled form of `Swift.Int`.
      #expect(CrashReportSymbolicator.demangle("$sSi") == "Swift.Int")
      // Mangled form of `Swift.String`.
      #expect(CrashReportSymbolicator.demangle("$sSS") == "Swift.String")
    }

    @Test
    func `demangles a C++ symbol`() {
      // Mangled form of `foo::bar()`.
      #expect(CrashReportSymbolicator.demangle("_ZN3foo3barEv") == "foo::bar()")
    }

    @Test
    func `demangles real Hermes and JSI symbols`() {
      // Symbols pulled from the shipped `hermesvm.framework` and `ExpoModulesJSI.framework`
      // binaries; representative of what shows up in MetricKit call stacks for RN apps.
      #expect(
        CrashReportSymbolicator.demangle(
          "_ZN8facebook6hermes17makeHermesRuntimeERKN6hermes2vm13RuntimeConfigE"
        ) == "facebook::hermes::makeHermesRuntime(hermes::vm::RuntimeConfig const&)"
      )
      #expect(
        CrashReportSymbolicator.demangle(
          "_ZN8facebook6hermes3cdp11CDPDebugAPI6createERNS0_13HermesRuntimeEm"
        ) == "facebook::hermes::cdp::CDPDebugAPI::create(facebook::hermes::HermesRuntime&, unsigned long)"
      )
      #expect(
        CrashReportSymbolicator.demangle(
          "_ZN4expo12isTypedArrayERN8facebook3jsi7RuntimeERKNS1_6ObjectE"
        ) == "expo::isTypedArray(facebook::jsi::Runtime&, facebook::jsi::Object const&)"
      )
    }

    @Test
    func `returns invalid mangled C++ input unchanged`() {
      // Starts with `_Z` so we'll attempt to demangle, but the rest is garbage —
      // `__cxa_demangle` should return non-zero status and we should fall back to the input.
      let bogus = "_Znot_a_valid_mangling"
      #expect(CrashReportSymbolicator.demangle(bogus) == bogus)
    }

    @Test
    func `passes a plain C symbol through unchanged`() {
      let cSymbol = "malloc"
      #expect(CrashReportSymbolicator.demangle(cSymbol) == cSymbol)
    }

    @Test
    func `passes an Objective-C selector through unchanged`() {
      let selector = "-[NSString length]"
      #expect(CrashReportSymbolicator.demangle(selector) == selector)
    }

    @Test
    func `handles an empty string`() {
      #expect(CrashReportSymbolicator.demangle("") == "")
    }
  }

  @Suite("symbolicate")
  struct SymbolicateTests {
    @Test
    func `preserves frame shape and leaves symbol nil for unknown binaries`() {
      let frame = CrashReport.CallStackTree.Frame(
        binaryName: "DefinitelyNotALoadedBinary.dylib",
        binaryUUID: "00000000-0000-0000-0000-000000000000",
        address: 0x1000,
        offsetIntoBinaryTextSegment: 0x100,
        sampleCount: 1,
        subFrames: [
          CrashReport.CallStackTree.Frame(
            binaryName: "AlsoNotLoaded.dylib",
            binaryUUID: "11111111-1111-1111-1111-111111111111",
            address: 0x2000,
            offsetIntoBinaryTextSegment: 0x200,
            sampleCount: 2,
            subFrames: nil,
            symbol: nil
          )
        ],
        symbol: nil
      )
      let tree = CrashReport.CallStackTree(callStacks: [
        CrashReport.CallStackTree.CallStack(threadAttributed: true, callStackRootFrames: [frame])
      ])

      let result = CrashReportSymbolicator.symbolicate(tree)

      let resolvedFrame = result.callStacks?.first?.callStackRootFrames?.first
      #expect(resolvedFrame?.binaryName == "DefinitelyNotALoadedBinary.dylib")
      #expect(resolvedFrame?.binaryUUID == "00000000-0000-0000-0000-000000000000")
      #expect(resolvedFrame?.address == 0x1000)
      #expect(resolvedFrame?.offsetIntoBinaryTextSegment == 0x100)
      #expect(resolvedFrame?.sampleCount == 1)
      #expect(resolvedFrame?.symbol == nil)

      let resolvedSubFrame = resolvedFrame?.subFrames?.first
      #expect(resolvedSubFrame?.binaryName == "AlsoNotLoaded.dylib")
      #expect(resolvedSubFrame?.address == 0x2000)
      #expect(resolvedSubFrame?.symbol == nil)

      #expect(result.callStacks?.first?.threadAttributed == true)
    }

    @Test
    func `preserves an empty tree`() {
      let empty = CrashReport.CallStackTree(callStacks: nil)
      let result = CrashReportSymbolicator.symbolicate(empty)
      #expect(result.callStacks == nil)
    }

    @Test
    func `preserves a stack with no root frames`() {
      let tree = CrashReport.CallStackTree(callStacks: [
        CrashReport.CallStackTree.CallStack(threadAttributed: false, callStackRootFrames: nil)
      ])
      let result = CrashReportSymbolicator.symbolicate(tree)
      #expect(result.callStacks?.count == 1)
      #expect(result.callStacks?.first?.callStackRootFrames == nil)
      #expect(result.callStacks?.first?.threadAttributed == false)
    }
  }
}
