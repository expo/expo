// Copyright 2019 Google LLC.
#ifndef TypefaceFontProvider_DEFINED
#define TypefaceFontProvider_DEFINED

#include "include/private/SkTArray.h"
#include "include/private/SkTHash.h"
#include <string>
#include <unordered_map>
#include <vector>
#include "include/core/SkFontMgr.h"
#include "include/core/SkStream.h"
#include "include/core/SkString.h"

namespace skia {
namespace textlayout {

class TypefaceFontStyleSet : public SkFontStyleSet {
public:
    explicit TypefaceFontStyleSet(const SkString& familyName);

    int count() override;
    void getStyle(int index, SkFontStyle*, SkString* name) override;
    SkTypeface* createTypeface(int index) override;
    SkTypeface* matchStyle(const SkFontStyle& pattern) override;

    SkString getFamilyName() const { return fFamilyName; }
    SkString getAlias() const { return fAlias; }
    void appendTypeface(sk_sp<SkTypeface> typeface);

private:
    SkTArray<sk_sp<SkTypeface>> fStyles;
    SkString fFamilyName;
    SkString fAlias;
};

class TypefaceFontProvider : public SkFontMgr {
public:
    size_t registerTypeface(sk_sp<SkTypeface> typeface);
    size_t registerTypeface(sk_sp<SkTypeface> typeface, const SkString& alias);

    int onCountFamilies() const override;

    void onGetFamilyName(int index, SkString* familyName) const override;

    SkFontStyleSet* onMatchFamily(const char familyName[]) const override;

    SkFontStyleSet* onCreateStyleSet(int) const override { return nullptr; }
    SkTypeface* onMatchFamilyStyle(const char[], const SkFontStyle&) const override {
        return nullptr;
    }
    SkTypeface* onMatchFamilyStyleCharacter(const char[], const SkFontStyle&,
                                            const char*[], int,
                                            SkUnichar) const override {
        return nullptr;
    }

    sk_sp<SkTypeface> onMakeFromData(sk_sp<SkData>, int) const override { return nullptr; }
    sk_sp<SkTypeface> onMakeFromStreamIndex(std::unique_ptr<SkStreamAsset>, int) const override {
        return nullptr;
    }
    sk_sp<SkTypeface> onMakeFromStreamArgs(std::unique_ptr<SkStreamAsset>,
                                           const SkFontArguments&) const override {
        return nullptr;
    }
    sk_sp<SkTypeface> onMakeFromFile(const char[], int) const override {
        return nullptr;
    }

    sk_sp<SkTypeface> onLegacyMakeTypeface(const char[], SkFontStyle) const override {
        return nullptr;
    }

private:
    SkTHashMap<SkString, sk_sp<TypefaceFontStyleSet>> fRegisteredFamilies;
    SkTArray<SkString> fFamilyNames;
};

}  // namespace textlayout
}  // namespace skia

#endif  // TypefaceFontProvider_DEFINED
