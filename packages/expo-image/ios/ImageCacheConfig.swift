import ExpoModulesCore

struct ImageCacheConfig: Record {
    @Field
    var maxDiskSize: UInt?

    @Field
    var maxMemoryCost: UInt?

    @Field
    var maxMemoryCount: UInt?
}
