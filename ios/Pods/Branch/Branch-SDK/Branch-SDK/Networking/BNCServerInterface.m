//
//  BNCServerInterface.m
//  Branch-SDK
//
//  Created by Alex Austin on 6/6/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#import "BNCServerInterface.h"
#import "BNCConfig.h"
#import "BNCEncodingUtils.h"
#import "BNCError.h"
#import "BranchConstants.h"
#import "BNCDeviceInfo.h"
#import "NSMutableDictionary+Branch.h"
#import "BNCLog.h"
#import "Branch.h"
#import "BNCLocalization.h"
#import "NSString+Branch.h"

@interface BNCServerInterface ()
@property (strong) NSString *requestEndpoint;
@property (strong) id<BNCNetworkServiceProtocol> networkService;
@end

@implementation BNCServerInterface

- (instancetype) init {
    self = [super init];
    if (!self) return self;

    self.networkService = [[Branch networkServiceClass] new];
    if ([self.networkService respondsToSelector:@selector(pinSessionToPublicSecKeyRefs:)]) {
        NSError *error = [self.networkService pinSessionToPublicSecKeyRefs:self.class.publicSecKeyRefs];
        if (error) {
            BNCLogError(@"Certificate pinning failed. Continuing without pinning: %@.", error);
        }
    }

    return self;
}

- (void) dealloc {
    [self.networkService cancelAllOperations];
    self.networkService = nil;
}

+ (NSArray/**<SecKeyRef>*/*) publicSecKeyRefs {

    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wobjc-string-concatenation"

    NSArray *hexKeys = @[
        // star_branch_io.pub.p12
        @"30821d9102010330821d5706092a864886f70d010701a0821d4804821d44"
         "30821d40308217f706092a864886f70d010706a08217e8308217e4020100"
         "308217dd06092a864886f70d010701301c060a2a864886f70d010c010630"
         "0e04081719fadd81059fec02020800808217b0b1d82a5e9c29eb4cb6fa3b"
         "21e38c81d4343136db6b5961e8f58ac7d6a6a8687f1fa999743eaf23d916"
         "e59c53457bcb7dd573d741fdac9c73142f76adbd1032ec5fea5145b823fe"
         "74a13a6318cb404f00230bab846d1bd6f179f6667d29ad93001cfe4933ba"
         "5ed90d0456ab1ef9ebb7bfb456cc5c58bec9c9cbf319911cc4733731e3a6"
         "59afee427166f77ddb354c00d23fb073b22e8649dae598edfad04d58b248"
         "803e6e4c8036bfee5884bd0f6a4052918ea748a7a281d019723b071ea799"
         "c5748a0cd9b71b773bd38dd07c98ee8ab7e8ac3f6de898747db3e4691b5a"
         "2315e17595eeee61ed95198d33fd738e8beeca09e4dbadb92b1431e5496e"
         "a5a38ae64a147b2efba4b418e77f52fa38ba64f263b4e4942e0e713b9f4a"
         "330b339a021f262fecb400115f3162da2849c53dd226498f781f57768d3f"
         "d08cbe7e791b093515ec8154a83fad46a346f28a2e1283810491d2e8b98e"
         "ac0a6622c65ddb96c3dea602d4b052898baa93d24e63d52fcc66bc8b7ab8"
         "252d4bb2ee7923dda59b944c3dacd91e787786bf120cae120e7c20fedac2"
         "521344f436c61f7570ac79b5862ed28e9e90186c3f350b26a15e2358efa0"
         "7d73366f509646c3b5aaddeac19c1777376fb48c976d3ad0884e13619301"
         "e196dbc249841c9e563e879287ae781e430711a3fd706ce3fe68897ab26c"
         "3e26e71d4abf22cae06cc07e2dc3d8e3ea6f90aa926a0cb5becd93d93aa0"
         "df9373d74de67b4d4242b27e5fc95506396d6e33ffb89ded52b52fd72532"
         "0cda26ab555730c21fc12902204ea52670f704f90df71c46eeaea4fed60a"
         "0191069274725fa072d1666965372679b5023a429a11ccf653a429f63ae4"
         "512d6f83db14848f192fd8aa2c20853f5527542e51d480d951cddbc95c4c"
         "863f277180170e6ef9752ad516297b42ecf70bc4e98bd1e68ee8b04b440c"
         "f22cd6b7b8a3486abbca1a900b208029ff2b14c9a8ba4c4754b8d70a42b1"
         "4ff1c6782084bf74f231a762270f05f62a6680f914b62007dfe0dd73f3e2"
         "5f22cdf32c03fb8ec55de51b9bb7d1989813c746d9152e0391d6643985f9"
         "cb5349c1f6acf219095e959ce8a91c5de8fc7d521410328e2d7b280e761b"
         "1a58b1d3774b1e987f297a31058829813838d904d45d8497cf788ab0c916"
         "6f8f30a97e7b8594e0779da590d58f5b7cc8fb75a055e774efb55b876608"
         "f5b125ac01dfa410cde94bdd9bda54195326fd1f9d007e4e074d51bb5fbf"
         "f25783e970e885f0e4a5270f4efbed66b3366a2f41636a21347c56539731"
         "d5259bcddae780da9cfa873592347f18475ec417ec32ec1fe3ff36ff1aad"
         "8fcd308470b152daee41bffa0123f106e17738eec27b47107a63b4b0757f"
         "ab2a9be6861e2b603f5a4d2eaeedfa263ada57b559bf03f36f22e2912930"
         "d8880de0a65b0f20d54c34338f5da2dbe88b092365eeff971179f3ff4a2b"
         "6da7daff59cfcd0e3c9ddf75edb0a7b2c6b13b39dc7a06ea81ac9a728d06"
         "67904bdb976905d4f331f6498e89ce2dc5e4f63d2285eff62d0e38f5226d"
         "aeb66649791b5a780edc909f6b85ae5daf528c4adbfb7cbaaefb0ac1ef36"
         "af27a7e54d5b6cbc31c9bd2d7340eb468139c1d307a5a0f9c5ee04970191"
         "cd825e692802afe607b56511201b11242d50d1ca0822aa1a64ea4db13f83"
         "d86340962638f0dbece4620e71d842f96fc0ad43007afac512406d68b333"
         "87c6b1fb4b251d1f2b40493d1ffeb3fe81f5528d556507c5953a0eccb063"
         "455cb3fcc1dee1a2d70ea3200de8cff1113f8a645ab9c3a9a0e32dee830b"
         "c6b0436678a3ccdf9d359d28f4df20e6d30715211ab9f0ece94250f19c0e"
         "4f77c1320697ba2beb3d2719e75c3e1c21f4c20fe35bdc004d270ee92e8b"
         "63820fed3e27529081e39f9ec032dba216f5fd5506d086af0793aa574de2"
         "ba7c5b1ef6f8fcfc977b0fa7380c33b631d79e9c2f65e6b8cfd4bc298c6f"
         "6df9edd84220602b60e77c0ef3503c44021487e9e06806021000020c7c27"
         "5a440244a4b46bec3f290bd6fb7406872ff969f0f5a8f60080c69937d084"
         "4ba8721b14071de4dced03562441eec7b5f251298b318a19c31bce01947b"
         "672e59b6fcdd366f11f039d0ca29b34ad2196ee108872644c7c2b36c0b1c"
         "953183fb948873df04c29c06cd8d0d88412bdf09702473ddf4acf6cf8b6b"
         "d360033aed2cba9e6fd9a8e092ee89655e185865173c84eeaf44d6f91459"
         "17fb09acf1c7523f02e008222cdb6c92b4ef1aa083125738a86f1c6a6bed"
         "c7c62cb1f862450e051e520aca4ea6dc43001d1f9f7dfb4063c4a3cbecef"
         "a7cc289b6ff9236a724775ab9070ace955bef51f53a1c3bedd4991dec85e"
         "d4ae058115069c4f8dffd9e0c5a7c2324da41b4cef05bd042f76ed7a552e"
         "c8cc6a437e84a422607f2192b916638b0359c096fb92d2cb636e5be89538"
         "5789e9ec05eaf279e5735cae74d3169294eff1283d0789046c6f04b169e0"
         "be04705ae8254c0d1cc568232ebcc2243b65c86fc77e145612569565a045"
         "ced0ec5a0d8b5c20f62c53925ee7beb499466a74d52641676fb12f8c005f"
         "2458b9b5652dc4b8d56ac427c6d06e8059b6a09c1b39547ab033f2888fe8"
         "a62a5fc57cda0fa660480d93772d35cef1e5541d562ec6aa72717bdc8eb0"
         "86d77aa3700068159b67f4c2f8a5f4318aa46ce7180f1dedf54fd0ee2e08"
         "954465c07d2f717637dbe55dce9f7e9b98b957c25ad9ebd7aef7f0af32b9"
         "c03e952d4a926bf70800cd3b14ead5a242f8a753fdd126ecd842011f812d"
         "ba1c1c2c59d96fe94494b24e5ba18ad86358a12cf805c2e9646d16b47197"
         "5910ea78c0527caf49f4b3093fd5b86374b3e6e5e90597d33d74b8f29d7e"
         "8e230df4e19a2dc8da85ebb8810f6ae3dc1b1e9cbe78743f5a02b9b21991"
         "a71e624b5c882f8720e89b0ae8e3da2d7f7111bf5a0ae38ca8c365bfe014"
         "a6a8a8b6547bab923d44bea26e03f42e741e4c2098a0b5229c13baac3c52"
         "f6d20cff7174d153216f48874a0b37ad9667cb467a8e5954840133ea9b49"
         "ca102a739c81d7b3cf07da4bdfd83590253d72b0f23b253876b90476978f"
         "b7965b2eba9e2af849aabe496aef5e1253ef28a848b7b57625b5b0820698"
         "143cf886f762fc2510ae2746a73df0b6bd7710b0b2f9a2972c22898885d6"
         "dc3d10dfd726e63a2100615322a100549d9cbcbd1e9527af58624a42eb44"
         "6522b1173ddead0045af72ca22740352856a07bf7d92a1e6c3720ce6cf28"
         "dd44dfb391457d526e141e23932876759d130bcc593db05e1fae1e7a4480"
         "6f03c31bbfd4940c23f3ed8171656c2dde108630e62ff6387b7787bf3b84"
         "bf625f7016cf2a460313367843db50ce08c99cc882d37e6f16720d3959d8"
         "4d9eb14a3509fccbef187647e52c1652a2963ba2af0e2dda4a821fc07876"
         "dba979e31293622f696354eba78a2a13fbd9d0145e475e3344a016a1cbda"
         "a333d6012695a23e9fffd9fb08467aee23d367daf78350137daa8101bdc9"
         "46bf23f9129d32fe59d79dee8c35b2c710cd5e8144ec5df0582b0d1d73ee"
         "52be0ed58fd2d9ca5d3641493d42f267214c9b97c7abcf59536761df604e"
         "43a12c3bc272656f5ee3501f27ce40f1021c1bf02b500bd5b122c98a04b0"
         "b3fd5bd7987b3e5112a9180df6d9612d8225d3e2bc921d70be3f2f6e873a"
         "0dc3fc08ba2f5cfed2d2b8d497ee508cb6e78667c99ccb1ff2f601015184"
         "b5520439b560cddccd590d7a95509cf5bdee6536838d4d512e9be335ae06"
         "cb822db11ed4b3e9a644a19b229a41efce4818f1c9b2b2d419d66be2d6dc"
         "d04d33debbdd48cf7498c60aacb00586bafca798e135688346c418db8fbd"
         "9411bd4348dc790d0d31e3bc073dbe7302375b0485ae3d0e341a82dc2847"
         "1bf1285605d6d7ed03f4373acd18ffca8f561c828899bfd3d333f21c488f"
         "de42eb7b9b635edbfe8a5910dabed8b75783bb994fd1c44b383f6bc0ecc7"
         "d055870092f27f6c15e5b0e3768a4b3204038bb2343bf2ba2888e7b9d25a"
         "530886799e22f3cab9102566c097c57dfa078c944da6ea365305b3c603ac"
         "f4acbb3d43fb2886ce3ba872be262978d7a3c2a3de7b3be26b35e521ad07"
         "d3c2acab616c7672bea5a26a5992a23507f6afaa1151c57209956e8d3c11"
         "a0d13fcc78f97b080ea1a858170550c00fc5a2c9b3b6b99b971a6e53fd59"
         "32ff36141934cec6b92b6cc36a3de68ce23214718d345198bd46c6f7bc89"
         "397b485149a2ced3c5939baa614e694090bbd4941909406daf213eaeb5c2"
         "a152abc1e836219372c3655ab180f945ddd57683ce20b052718b9bb09328"
         "c50d3b9e9839aaba310a7131a112585dc25875cc1ef43f54e102f3b679f8"
         "51136de5636dca53a8b320a7fd83c463632d649fc0cdb08e51474b316949"
         "b6bfecdec4f98a9ef607ec70ec7a0d320759da6625487bf64e3f031c9a14"
         "5f9e7553fd44cda1082ff319c495d3da39d24a3aa8d4799740c6a71c00a4"
         "5aacd20fddeeb4e25ed79f56295e90d7a6ffe85f817f1396f2ad3084b568"
         "bec8e47305c0ceb4f650efe84ddd1746fd8515c67fc8f9441231943578f1"
         "0d9309f0470fd88ed5766513b61864c543dbcbd5f503513fad6891bdde3b"
         "d8cde30c390ebc1753f9fb6146132b096da9eea9d910d715b0abc9b9b8a2"
         "225d4d1fbfdf212689f3408043ada48c7a8f3c957e5893a095f1eb616ef8"
         "8a4f4d2286b9d6ee16e6292bf63c1af4689262dfeb7b1ad5f800a25fe962"
         "08109fdbe1b9d045cb4eb531161f259f7d0ee05cfb44d4ed28215368c1d2"
         "f8cdc31516424f766671185eb375171aa4723cd7f2a5156d3737e92a3703"
         "b7560b9d53bd97de47a2b83f5b2f877a1febe759b50d37a2616700f0e043"
         "b07229982c5fd4a2b89a023751bb6c926fefa56a14dad8878c3c6123106c"
         "482a93de2ad34e162d092e24243a46286f17b32729303b0e3daed29cc4a5"
         "b0a458f575e6063d67d8bb9fafe1fa1fb91fcb7b14c3f3015ddce212b586"
         "0cef6bf27d833a273b09f25148e264bfa2491de08bf52f8eb9f3c8f140f7"
         "447dfa3a2c38c06615cc83358559ea3f370982c7eeb5221720aa3ed1bb1e"
         "8ea5ea2a9db403b1bb16c0d245f9c0e0d4bd41722bcc3a94b1f51faa16e0"
         "d09841a5e0c6627ed567fe3657cb3b32141ee399ad7e9f11d090fca04172"
         "7c3e9a3ee8948f8f10e84127781c2c9bed4f616f1810f3dfaf4bc89e564b"
         "6a9f017bad8bf2a3852de3defd5c9ff92c1442081ca08e61662ede9e9389"
         "b2a981662f3a4efe6f40fbb323de7df7df8713f0c27b2a8eb51afff09336"
         "792bb6cf0bb19237b1b92ed03e52b9dc8528c197b703a2c792db7023403b"
         "b6e700f0e0bf02634297efeb06bf9397e9283b0b37919ffef68ae54486a4"
         "11e7cbc9b76d2cb30f9f873da480088a4e3aeda59996aedd98fe18f62274"
         "6f01038ed9faaf0fbbc0889efbad86afc401c22be2289a2979d161cb1618"
         "380dd61dc122837eec977de875a49099dfe8208b6608ed67973192f3c53c"
         "fa58096c79568aae7d114454a6ef9f5d14697d6d59fde24f14ea694bb7ea"
         "2ed4fbf1b16aa3ed11bd5d3d22c75ef51574d2fa4d1f0e34a919ef83b82d"
         "99cfc010fb60a8d861adabe66c171ac2d2adb5f0f349ae7cb40a7affa18a"
         "f72ea0cea6e1c2cfdb4f955618a0ffc57e1a2e896a39d83fc9fbe69eb349"
         "a57d1fe312697542cf9192ea2021b0f9872894b87198af516fc235397112"
         "5d827cf8444f432b917719d18c79b6a941ab5e243b4b02e77a67d3b23f4b"
         "85d0dacff367d363a3c2c19d6a82125a54bdbaffff61e23e399c967115ba"
         "5b4ec265f0575bb847635d9e0a17385c612916f401b1321da3086d33cac8"
         "a09c4602acbd06e8d049bdac08dd3404ce011815d160770401f293dbd1b0"
         "a713110829ec0b5318ae2e19a5a613ba8db7c06e6231f9349f9ffd0e6a5b"
         "8025f26e6057d319d913a680245a541ddce8a97037d646f80ee1b1ae4597"
         "10738db07ff58e7f06aaca03426d9d6f8dec2f22b60a2f71804ce77b3bd9"
         "923fd6d8ee4bdf7fde3bcb9661c409d925ddcb92e6f0ff1f739900dd1316"
         "f2dc2ac75fab028a4db87039f208c7b5d77b8a76f6aec96b38edeb3ea8ef"
         "089b6050eeaf964892ec29a2c592c23dec14c619bb573bf5edebb41d257b"
         "b6f527f852e83cfa5c0c0aef99f587306cb511689ea1b0f0e2ce1fb598b7"
         "3e6866d495ad30b7ae771e4724f06e4f50d3aadab7bcbcb87cb45e9cc1b8"
         "ce95ada91a48bba07902c24638135e18000c41aa5c2bcd0df7af19d5ee92"
         "ba923f55d2bcb31edffe33c2ec8b5149eb5317d759e9f3084c47bf64eee7"
         "921b226c7e223b668bf10f19bffc49c962aaa04ec561532469fb8f1929e9"
         "f9f1bc2b9dfd0989d13a1f329016c865b489b754a60c88e558ba7f8bd71f"
         "e796d6f378ee874ba37351630efcf5a4715e9107b4a93afe4d543a570bf8"
         "659a31e5aa47b1caa6bce24d4797e575335f5bcd7fa7b94ebaa9f80852b4"
         "c1a8e41d41903b087df44c349463e261c00944fdd07af6df9dc9aa077b42"
         "7084b8069626a8b455ff54693f220c054de6c1c47c11580bacedc0a1aef0"
         "e49badd0e2bb421567364f535264f0e14ea22676aff0e48b3143388c22e6"
         "ccb077578f6e4686d93c9d29b91f2aa476b94cac609d9878bd8cbc51e752"
         "4555acc8cbce0da2dcb26ed222ce218b2f01e25faa41b0af9fd93ce5e07e"
         "5655a1e4af07f4c549800276d3276abbe48693430240059698f7b2f24a33"
         "bc4df087ce12c6487ef27a3378a70327c81ba091b981003341847312f6b6"
         "4ae58ea9d83f013de5a592e211fe226f229772ac35741b8bf3297aebcf8c"
         "d512e2de1a79e89d3125273c875c124e4b6bae0cba2419a3e1198a505fca"
         "68a60f813875b0f2322719f6ca75f8cec0e25456858619d58db1e431062e"
         "ae60cccf809d213be77f1e54fa0adfb84682353a77b6e99fcdf172e13397"
         "b07a1a235a506a926d3dac91bbd4f900716036c99d54108f368221745759"
         "6eccefd3b06614585330e520d044ce3368805ba180ea145a4a10c35a2962"
         "b927cd7d422b3a4d86a2bced9263fbd9c20f65a83f1435086524de172035"
         "c4c115ee04bf9b5e5d5e07179058ce99c0c6ea2dca1182872f97488cc5bf"
         "182173fe478ec7bde8bd57ce02dadd8441ecf3c0220a2e36337ec44a3bf3"
         "b5e95eb35f2a1cc56ccd063a10bf1da59c55be2059220b3b5e1de9503353"
         "d8a0bbaca99c0ad8271d359bab02b228411b99f588717e9ee0fd0ca645ad"
         "20f4e009c01d136598daec59435728806481f9bd60f64ef320f00450a884"
         "e5f9980446245ca692168ba73efd3dff64cb5d4a23dec2a4c4b4d11665bf"
         "cd0c3792c1d642403c7ae678bacde4e7051b3825f5f7ea6858231d70fa5a"
         "e7da4ad7ce2741a674c90f470493f22031f6ed64cfdb5989b346561bd557"
         "2d12e1fcdaf7cb74064e6f3946167ac0ed35d879bc599a314245507d3026"
         "57ec98d45b2c3267404b1e734af4a7c0cc531910222a75a54d34ad56e4d9"
         "106b307b682166e933152f1dd60f0ffdd6c339d4f8dc7ea0df87bec294c0"
         "08ceb8827064a4c42fc3b03a86fb787df25773ec0fcf30156149fe43c5e9"
         "015d58933e885bf6c99089ba4ddd253a52c3853e1895df6fa8f737a04854"
         "45f8f1e2fdf9de2f2093c258519cc70a5c9eea97e315e99626eea5d07296"
         "df760d5aac0ae1844cf35088f09e99ce1df40d067d4ba5538bd61c55cc9f"
         "a4e7cfc917b1524aa71b8ab581c687de7968e1b0de773d279c90da964a7b"
         "091c8ac86c96da1da13b4ec54df0c4eb5a124b9d0b602b82e1aab2278102"
         "c70bbc2b6e57641dd15199e014cb3583ee80901ea0b9a9c49404a2e169e3"
         "5fddee9777c5b236bff13963517f534b5fd79ccd46086d75b91374d76de7"
         "46145359e8c7561577e33dc90f3eb5e132d48202f67706e6e606bc18df24"
         "6fb8adc8d5b67829049e1d614a82d9d688186189ec39374b93ccc7b291a4"
         "cf6c1e5d0aa638428e2f765dda4397d5e9b0e29706b50803093d49f84eab"
         "1e364e009e7205c8747461988719dd3b28945aafa1034f747c9fcd2e7fe8"
         "c48f299587034ecfbeadb13a82e5a7505f4eb1beb72feaae8b342982fd63"
         "eb93cc9f66b772a1e01bc6aa20a9e2eedadb4202e939b0cc34d4d6f6d530"
         "0e7e29ef0a841a16bc76665b0a0807ac3e1adb3bf6ad674f349d17f82826"
         "af1f4febebb5f786af625c57bf37f5c74231ce5874cd2b53bfe82c8b051d"
         "8cf613e4cb0322bc600fe78d572a0d2d03e0f5e08b6c29576c871327cf87"
         "f0c968f9a54fcdb58e41cc52659ae5fc48bd98212c6c371e91dabab2e581"
         "79be16722b52777fd0c5f9db3d73179277bdd36971bdd9f224f12d1077a6"
         "779b3e52240aca0ef4ac8eea4b3baeea36ecbb936ae9f9ff470dd52d786d"
         "a3b74c3e05ee3be7e7511d8e83ffb920f7f99afc93dc102ee19d830fabd6"
         "b3c0a80a364140376d6a3917974ffbbbe3d01a96ba1da6e2266a943298fc"
         "fb68daebe117b4fed13619e9d6fbe8b90424493d46bb469ee7f2c3554ca0"
         "a0c0729055164fbde9051f96531722bfe5bf5d323a4c28ae4ce129acf719"
         "e1605be616f92ae88b8372f39bd580cf6cbd901d1a642d3082054106092a"
         "864886f70d010701a08205320482052e3082052a30820526060b2a864886"
         "f70d010c0a0102a08204ee308204ea301c060a2a864886f70d010c010330"
         "0e04085b3bf84b13079d0002020800048204c8194223d7a0c479fc2ee690"
         "d036228e05ac153a061b4cf3763afda35d3f7776ec67bbdf66edf3b9c813"
         "ce1e4cf5f748a1de513ddcb80830f060eedc2864927d8b53708d6cb7b5fc"
         "1da50066b60f6ab28e7566393ff667033dd11e2d6a580abec48ea8521f3e"
         "956f296cb24cc3484ddf341e7ad8b19d35f309ffc0b327aef552307107a8"
         "784882e1a4f4e1521a5037dc524907c67a93c4e58becf8dd4726893d7a1f"
         "1c6cca488af81d4fdb7c17156fd8b9dd5f7699b4186cca9d00b6dd25e3ba"
         "c09f12883fcd25fba6cfba0c6c4591500c88514cfa5c7073699975407da8"
         "4f7c760301c22b7d574dbe0aa121c41fc50d5f74d28664b9b1af3ab6d0ef"
         "854142d0e425cd42147e3eddedef0a8b43893466d58ac4568504b25beba5"
         "9592a5af146b0769d30f523f328e54ed69e9e0499fb88d3cdfebeeb0f304"
         "cc332f63c453f078f4ef960625e6f5ccaa2b9d8c71eaf5aedd0592cbf88f"
         "8cdfce6ed4dcf77b8cdf90c08f196222d93116ddb18a3ebc0dba8a06af14"
         "39657f1a0f832cac6a11351fce714c2a4b637e6930709b10f7f1a470258b"
         "5153a5c7719a34565352c48e72ee5477bebb0a2630a7d36f1b8fca6079e3"
         "cdabcf7ca0ce5ea10dfb13ce9b7815073b86dec4d758f2fa17cff3df5252"
         "50a76ea9023cee3a920f8f95b965795c3d1ce2bd59e9d66280443eed94ff"
         "01a042fbe21ebdbd77396edd94216cea47fcc24a5c46a6b31af99b2e4134"
         "eb27030cfe98ec97b32a358ab594a2eda3f98843da4e009c21b02c27caec"
         "a657cf39d04034fc21fd31f4c2ddcb69561ce6d1eb69448cb213f6d4896c"
         "b47de1dd1d0421ce28b5fe501af3abab42ff9f2baf8e43b385b01db37df6"
         "818a6e216b78579ef14dc91074f7f882292f934ec7ffa8d71b908a11ac77"
         "5372d215453beb3f10944e3da8b5ecd23be2cc9d93e08bf32357f92082e5"
         "40c3a170f10ec399ab75a34ff239832c338fe944f48d9645560d947823d8"
         "285d18210870fcdbab6b20b253c9ad5a77804f786c06923dbc74bd195035"
         "0b130dc85aa0b1d50a3a9947c18631d0c7e62fca02948197801dae422059"
         "d078182c1d2e53d44be5e438ef0ebc6ff4943eb28c3701b2202f15841e96"
         "edc9499437f47e2bf82c290049bdeec637092bcca2580c3d7b18025c9659"
         "f8bb5f141c50ee2c79dd7696a7c3f55b47d62cf9bdd1345be022957e51cd"
         "e17133797c4826c424f0d163a1af905e12788f016e4cfce8d57ed5512abf"
         "41fe303a1b93f6dd18455a983156d59bc2bcdda69aea0fa2d2c3f54d5ac9"
         "2a1ca9130106e345611c4f29796798a1f4996f3d5a3fbee6c14efe8e2f34"
         "395ac7bbc3d4c5b484a0146218b1165def63c14b52cf88492bc3228b8da1"
         "ae63bc904feab3a766b2867115c9d8a5ab26ea4344909e64c94eb7aef913"
         "d694cd65fed02312341aa89774668bd7e302c8b377432807ccb184407196"
         "b954fc86607ee5ab6bba9741955d61b8a4317971701512a1160186e5e89d"
         "9b1217314a4a8632e7f3372f43b61cddff07e72f17b7d356a14cf18c6e59"
         "5d9e4b3b449fbd26fb2795807ca4a5576621d803d2b0ff032d5a3c14cc3b"
         "c261062844d015c9283d20414dc71e0a8bbf2a94c67b915a03edee764bdd"
         "5c03e72d8cc0c66a33124aaaf777b6e58089b9e0b838eb396b828352d460"
         "3023715ab2b87878d9f206210bddad1b7b701f36de4173eb1ec553e19908"
         "e188b38dbd0ff3692d13894c943125302306092a864886f70d0109153116"
         "041433d43dfd9efcdf7b8d8708b8cee57e9d59896bb83031302130090605"
         "2b0e03021a05000414c5febe88e845ea6e974e04fc48434b2c063adc2e04"
         "08e31d2b0bdc35a19302020800",

        // backup.pub.p12
        @"30820a31020103308209f706092a864886f70d010701a08209e8048209e4"
         "308209e03082049706092a864886f70d010706a082048830820484020100"
         "3082047d06092a864886f70d010701301c060a2a864886f70d010c010630"
         "0e04085d4c303f4024c4ac02020800808204503c4cacf46cae0d5dfc7ead"
         "39046850063e536759df5e2cb48c9ecad20c50aa600f3e5a29bd8df7ae53"
         "5a7379df01fedba23141ccc776a05e621193dfea53cf01b8297cbc895d64"
         "ad6b87208b59e58a70a0919e746402eb47acce65ce2b3368b44b0186a57f"
         "adc81a55bd886e20ecad6f30d10b5f69193e603eb508636209c682f740b7"
         "2f4f97f50ce157c42769f07d9d0d5c7eea2864c5fcf9b47165810c42afbd"
         "82c4537742eaa15069af7acca7585f041bb54f97d37eb11b5ded9077e98c"
         "b5fad12f6a5b91b4a1d201d1da7b41d2c457ced09bec8d33576bdb6ee1a3"
         "aaf2b5de9c19ec97616adea7c29cf8aa7be5fda07a9adfde4343195f5fcd"
         "f65154453753fd298c52ccf0f469068fa404d1faed762664ac02c35fc4da"
         "8a015cd00369fcb3e8b58ff4e292dbfdcea3469469d46abc06ff99360b5b"
         "993b1330a21f051c384932b3221b63b71278bb1c642ad47027df4fddc8fe"
         "19231d7d3759c08d1b4decfbc85f08a6273a9820e12d5e0f23e7c1517aea"
         "d6afcbe3f14339c948bed6ecc9a6c7816710186ac1daabc66e6d5caf909a"
         "6e2c240b8ddc85275084fafd8be781b2d99adc411bfb110d0118d32a5482"
         "d4b34c8ec833edfc0f27b8275b8785b5584277c87ca00ce9c339c8a64dfe"
         "e6e0bc43d088d5974f81f4c72ab13a2b8e6bcfe8276e6b8aac0f626deb8c"
         "d835f6ba6c27184cf311f75521f873dd4ebce72c99aa096db377a5120791"
         "811e8ec816ebc313ea07112d7041bd6f0b86d39ba0acd15fac86ea49e22f"
         "da1a743376250e89b33b9608e10d76b91ab05934748a0551bc18c0416252"
         "79adea084833de8e9666757e901b9595a7ebb2e321f67efb6b728c62b3f3"
         "6709ce491d33a6cb4ff53af08b0a33390959ae4f5b251a455ff2f13d8c96"
         "ee1b7bc9c0711a28fcf052429c6db413e14bb4d850b42972880d6951d237"
         "0de0123a29a0d13594e99ed602ab5b369542956d5e07392785fd7af7e91d"
         "f9646f58591bb98d3b5efc3aebd3b4cac45285e4f99ac316d011d15072cc"
         "4aa75a8fcf79ef1df10a4b8cad87d4aafc70a73ec77bd4a42eeef898a600"
         "16b0cfcd5ee79d0c02992d0953fb779cb0818e78f14001931ab2b74c06cf"
         "3299fcd68cbf29da5324e9741ac39fd3c66555d1311948ea8ed93406ff04"
         "b59de5c56673221f04863058d429b0411762b8dfe5b0c46dd678fc32b9a0"
         "1b54bdcf02508a78044fd1884cff43224b94c2bef3db0ae7a82f58f6ecf4"
         "a62bbdebe7c3deddc4801a67604c7dc390d9b9f7e398942209a4cfca3e68"
         "a81a797f82e1bb7b4a6105be6e7772c6f875a1c4bc6a50aca6f9f911c8d8"
         "9dd8c8134203e44fc82901d4078262037d447ac0fb3166512cdb1877fea0"
         "6193349d10acc5b6af7462a811adfe78ce2899eccad87f10f4ecb0c9d97b"
         "12daee1c350b9729c9abc145860e192f406e0cf80db45b03386b91fe9d8e"
         "028af7891b3681b5ff79cc3696e40211bc3692d85624e697205dd8611f80"
         "0920956b9b814e9a89184e3d80b60a94e424fc1aba581b399e817925cdf7"
         "97bcc845243bde101f87675cd03082054106092a864886f70d010701a082"
         "05320482052e3082052a30820526060b2a864886f70d010c0a0102a08204"
         "ee308204ea301c060a2a864886f70d010c0103300e04080a30e62339817c"
         "0302020800048204c8f0f4b8734e85c4b2763da2baa5e74dae7f5f7a26a4"
         "67dbd1cd36ccbfa49ab525866e8a0a6d099964250a187bebf4767870bb4b"
         "7b5d3147af7c86be232377f00888d992e21572fa9238284931b39fd349a7"
         "69ef7485e334408ac45b73017a65c08813d72b1a1d6bf6e2271793a58021"
         "5639e3280520396ba298e4716a1dcf6853ec02f4236f2c3eac0743cc908e"
         "01738ef62d4ed2dcb4264227c446cc7dc093a64345ad9cdc11d3aca666a8"
         "91d8c345be73308ab4012194325df439facd71abbc7a0aeaae4c60c90b0f"
         "8457b209dd1deb76709b860314dae14720d7e152091bc8dd04ea7af96785"
         "024194ce868299720065b8520a94d2bb5db1b3353687cb62bedf4ee4d7b9"
         "39c81b4cc6be37695f8228a9c0ce40b2603d05978748e772d5b40268993a"
         "9d2e5521c3a79e203b4065d89b049ced139be6549601100138ee3968542e"
         "2fd52e8307591ec5a825658a320f7e39a69566a30be654d4ec592d774002"
         "6410c3f8215bf2ee373c5af3e55841785366f8f9b55ffbe5f511d71c8f26"
         "4a2ee960fc017a7afbb8564b7510aeb5c3ec05b1250731af167a605897c0"
         "368776a1ce36664719e0afd10fc22580a1d170a5f852b8d3a0e9fbe80f76"
         "1cc40e449ffd936d963e5f95ff9b13cba96249f98711510490a5701a2f79"
         "ba13e1e26dcd85704ac88c46e2c17e69c79cad76380f7d1e35dc752dae06"
         "0ed8c42d2cfbbaf5fd23c19ea82ffe333d067eec52a12a83cbec72914dfe"
         "a31ca9e35c715939e2362805a6cd12798bd035a20c4a504c8cc652a3010f"
         "35c929f24c0fc2b3fca50fbfdd7cd6456f635e80c701651d0085eef132e5"
         "fd9c8089ed7ce4193a8a8d5ea80d332f258aa7b110a6ef94b69a96fef5c9"
         "4ac4f4dd6c1eff6564e7bb5cbfe818acd80b5b2d7ade528accfe69905ffc"
         "1a467e65dec4fc8c04063e3634197daff410e2dc92a6411bad3e1235a6cd"
         "5579ea8a1101222d7da3bd6995b609a2b25a1a93782f597e5e938e7623a9"
         "3e448d06e2db34444f476929e9a50d425285b619733d9797249d1b035634"
         "8afde198052fef79691571289da371bafb56e3750bd500dd1e3a424433af"
         "ab44656ccd5dedb7ec8c2c970e7774495a06ceb072519360addae38aceac"
         "4f27fcf117c9f527efac193625a4c5916f51e557fed555c0678cc93cc018"
         "134e0edb283a71ee50237a9bb150759169fcbd7b24a75c3493a6b4194c5b"
         "8cd79da37ebef2a63bc2ac9b9b75502fc0b43cdd6f942e4943804dc0ed0f"
         "b4c7b101c5d5aee4f6e0a18398b35bf25c69b598e1244cc722defb5878a3"
         "b3b6ea797341615cae10239736d94a63497debccc54fe2cc7a5f8d15efa2"
         "f65df4fe91ffab81072f545e41dbf4c8d7f273d608e492c1c5a32268bf82"
         "ed51acd729c2121027a6de1903ce4b23c13ad548647c6836ee7788918124"
         "7660c55a9825babd3f086ebede5c4725618178bb0db5d17d594cabed63b6"
         "83e6a500d8a6ee8b2ac287213d6710579db444730c0d9fe24649c368bce5"
         "ac1e61b3ca854c1da6b9ef47d4886c6b4a1c840d644eac8d2bc1ea8f443c"
         "83239d351e1fdd3ba6338a94920b382161b4519da6b6dd3ce717b24f96f4"
         "acddf70a241be2ef1e964bd83c0eac927d5ccb503b5f9a06850b1f532d23"
         "d6c82a4fba847d7e867bae4b950d7760e941664526e9b8f4dd98907d90ef"
         "a2e8d35f8cb4294b642a29af61b5534a540befa5e71562e8efdda232fde7"
         "fb6c963125302306092a864886f70d010915311604142942010915a82174"
         "5e3f65fd1a7b0e1daaf6d56930313021300906052b0e03021a050004143c"
         "0c50131fbfdf668827900dc7c8ca72a38609a70408d50691caa0a421c902"
         "020800"
     ];
    #pragma clang diagnostic pop

    NSMutableArray *array = [NSMutableArray array];
    for (NSString* hexKey in hexKeys) {
        NSData *data = [BNCEncodingUtils dataFromHexString:hexKey];
        if (data) {
            SecKeyRef secKey = [self publicSecKeyFromPKCS12CertChainData:data];
            if (secKey) [array addObject:(__bridge_transfer id)secKey];
        }
    }
    return array;
}

+ (SecKeyRef) publicSecKeyFromPKCS12CertChainData:(NSData*)keyData {
    OSStatus    status = errSecSuccess;
    NSArray     *items = nil;
    SecKeyRef   secKey = NULL;
    SecTrustResultType trustType = kSecTrustResultInvalid;

    // Release these
    CFArrayRef  itemsRef = NULL;

    NSDictionary *options = @{
        (id)kSecImportExportPassphrase: @"",
    };
    if (!keyData) {
        goto exit;
    }
    status = SecPKCS12Import((CFDataRef) keyData, (CFDictionaryRef)options, &itemsRef);
    if (status != errSecSuccess || !itemsRef || CFArrayGetCount(itemsRef) == 0) goto exit;

    items = (__bridge NSArray*) itemsRef;
    SecTrustRef trust = (__bridge SecTrustRef)(items[0][(id)kSecImportItemTrust]);
    if (!trust) goto exit;

    status = SecTrustEvaluate(trust, &trustType);
    if (trustType != kSecTrustResultInvalid) {
        secKey = SecTrustCopyPublicKey(trust);
    } else {
        status = errSecDecode;
    }

exit:
    if (secKey == NULL && status == errSecSuccess) {
        status = errSecItemNotFound;
    }
    if (status != errSecSuccess) {
        NSError *error = [NSError errorWithDomain:NSOSStatusErrorDomain code:status userInfo:nil];
        BNCLogError(@"Can't import public key from pkcs12 data: %@.", error);
    }
    if (itemsRef) CFRelease(itemsRef);
    return secKey;
}

#pragma mark - GET methods

- (void)getRequest:(NSDictionary *)params
               url:(NSString *)url
               key:(NSString *)key
          callback:(BNCServerCallback)callback {
    [self getRequest:params url:url key:key retryNumber:0 callback:callback];
}

- (void)getRequest:(NSDictionary *)params
               url:(NSString *)url
               key:(NSString *)key
       retryNumber:(NSInteger)retryNumber
          callback:(BNCServerCallback)callback {
    NSURLRequest *request = [self prepareGetRequest:params url:url key:key retryNumber:retryNumber];

    [self genericHTTPRequest:request retryNumber:retryNumber callback:callback
        retryHandler:^NSURLRequest *(NSInteger lastRetryNumber) {
            return [self prepareGetRequest:params url:url key:key retryNumber:lastRetryNumber+1];
    }];
}

#pragma mark - POST methods

- (void)postRequest:(NSDictionary *)post
                url:(NSString *)url
                key:(NSString *)key
           callback:(BNCServerCallback)callback {
    [self postRequest:post url:url retryNumber:0 key:key callback:callback];
}

- (BOOL)isV2APIURL:(NSString *)urlstring {
    return [self isV2APIURL:urlstring baseURL:[self.preferenceHelper branchAPIURL]];
}

- (BOOL)isV2APIURL:(NSString *)urlstring baseURL:(NSString *)baseURL {
    BOOL found = NO;
    if (urlstring && baseURL) {
        NSString *matchString = [NSString stringWithFormat:@"%@/v2/", baseURL];
        NSRange range = [urlstring rangeOfString:matchString];
        found = (range.location != NSNotFound);
    }
    return found;
}

- (void)postRequest:(NSDictionary *)post
                url:(NSString *)url
        retryNumber:(NSInteger)retryNumber
                key:(NSString *)key
           callback:(BNCServerCallback)callback {

    NSMutableDictionary *extendedParams = nil;
    if ([self isV2APIURL:url]) {
        extendedParams = [NSMutableDictionary new];
        if (post) [extendedParams addEntriesFromDictionary:post];
        NSDictionary *d = [[BNCDeviceInfo getInstance] v2dictionary];
        if (d.count) extendedParams[@"user_data"] = d;
    } else {
        extendedParams = [self updateDeviceInfoToParams:post];
    }
    NSURLRequest *request = [self preparePostRequest:extendedParams url:url key:key retryNumber:retryNumber];
    
    // Instrumentation metrics
    self.requestEndpoint = [self.preferenceHelper getEndpointFromURL:url];

    [self genericHTTPRequest:request
                 retryNumber:retryNumber
                    callback:callback
                retryHandler:^ NSURLRequest *(NSInteger lastRetryNumber) {
        return [self preparePostRequest:extendedParams url:url key:key retryNumber:lastRetryNumber+1];
    }];
}

- (BNCServerResponse *)postRequestSynchronous:(NSDictionary *)post
                                          url:(NSString *)url
                                          key:(NSString *)key {
    NSDictionary *extendedParams = [self updateDeviceInfoToParams:post];
    NSURLRequest *request = [self preparePostRequest:extendedParams url:url key:key retryNumber:0];
    return [self genericHTTPRequestSynchronous:request];
}

#pragma mark - Generic requests

- (void)genericHTTPRequest:(NSURLRequest *)request callback:(BNCServerCallback)callback {
    [self genericHTTPRequest:request retryNumber:0 callback:callback
        retryHandler:^NSURLRequest *(NSInteger lastRetryNumber) {
            return request;
    }];
}

- (void)genericHTTPRequest:(NSURLRequest *)request
               retryNumber:(NSInteger)retryNumber
                  callback:(BNCServerCallback)callback
              retryHandler:(NSURLRequest *(^)(NSInteger))retryHandler {

    void (^completionHandler)(id<BNCNetworkOperationProtocol>operation) =
        ^void (id<BNCNetworkOperationProtocol>operation) {

            BNCServerResponse *serverResponse =
                [self processServerResponse:operation.response data:operation.responseData error:operation.error];
            [self collectInstrumentationMetricsWithOperation:operation];

            NSError *underlyingError = operation.error;
            NSInteger status = [serverResponse.statusCode integerValue];

            // If the phone is in a poor network condition,
            // iOS will return statuses such as -1001, -1003, -1200, -9806
            // indicating various parts of the HTTP post failed.
            // We should retry in those conditions in addition to the case where the server returns a 500

            // Status 53 means the request was killed by the OS because we're still in the background.
            // This started happening in iOS 12 / Xcode 10 production when we're called from continueUserActivity:
            // but we're not fully out of the background yet.

            BOOL isRetryableStatusCode = status >= 500 || status < 0 || status == 53;
            
            // Retry the request if appropriate
            if (retryNumber < self.preferenceHelper.retryCount && isRetryableStatusCode) {
                dispatch_time_t dispatchTime =
                    dispatch_time(DISPATCH_TIME_NOW, self.preferenceHelper.retryInterval * NSEC_PER_SEC);
                dispatch_after(dispatchTime, dispatch_get_main_queue(), ^{
                    if (retryHandler) {
                        BNCLogDebug(@"Retrying request with url %@", request.URL.relativePath);
                        // Create the next request
                        NSURLRequest *retryRequest = retryHandler(retryNumber);
                        [self genericHTTPRequest:retryRequest
                                     retryNumber:(retryNumber + 1)
                                        callback:callback retryHandler:retryHandler];
                    }
                });
                
                // Do not continue on if retrying, else the callback will be called incorrectly
                return;
            }

            NSError *branchError = nil;

            // Wrap up bad statuses w/ specific error messages
            if (status >= 500) {
                branchError = [NSError branchErrorWithCode:BNCServerProblemError error:underlyingError];
            }
            else if (status == 409) {
                branchError = [NSError branchErrorWithCode:BNCDuplicateResourceError error:underlyingError];
            }
            else if (status >= 400) {
                NSString *errorString = [serverResponse.data objectForKey:@"error"];
                if (![errorString isKindOfClass:[NSString class]])
                    errorString = nil;
                if (!errorString)
                    errorString = underlyingError.localizedDescription;
                if (!errorString)
                    errorString = BNCLocalizedString(@"The request was invalid.");
                branchError = [NSError branchErrorWithCode:BNCBadRequestError localizedMessage:errorString];
            }
            else if (underlyingError) {
                branchError = [NSError branchErrorWithCode:BNCServerProblemError error:underlyingError];
            }

            if (branchError) {
                BNCLogError(@"An error prevented request to %@ from completing: %@",
                    request.URL.absoluteString, branchError);
            }
            
            //	Don't call on the main queue since it might be blocked.
            if (callback)
                callback(serverResponse, branchError);
        };

    if (Branch.trackingDisabled) {
        NSString *endpoint = request.URL.absoluteString;
        
        // if endpoint is not on the whitelist, fail it.
        if (![self whiteListContainsEndpoint:endpoint]) {
            [[BNCPreferenceHelper preferenceHelper] clearTrackingInformation];
            NSError *error = [NSError branchErrorWithCode:BNCTrackingDisabledError];
            BNCLogError(@"Network service error: %@.", error);
            if (callback) {
                callback(nil, error);
            }
            return;
        }
    }
    
    id<BNCNetworkOperationProtocol> operation =
        [self.networkService networkOperationWithURLRequest:request.copy completion:completionHandler];
    [operation start];
    NSError *error = [self verifyNetworkOperation:operation];
    if (error) {
        BNCLogError(@"Network service error: %@.", error);
        if (callback) {
            callback(nil, error);
        }
        return;
    }
}

- (BOOL)whiteListContainsEndpoint:(NSString *)endpoint {
    BNCPreferenceHelper *prefs = [BNCPreferenceHelper preferenceHelper];
    BOOL hasIdentifier = (prefs.linkClickIdentifier.length > 0 ) || (prefs.spotlightIdentifier.length > 0 ) || (prefs.universalLinkUrl.length > 0);
    
    // Allow install to resolve a link.
    if ([endpoint bnc_containsString:@"/v1/install"] && hasIdentifier) {
        return YES;
    }
    
    // Allow open to resolve a link.
    if ([endpoint bnc_containsString:@"/v1/open"] && hasIdentifier) {
        return YES;
    }
    
    // Allow short url creation requests
    if ([endpoint bnc_containsString:@"/v1/url"]) {
        return YES;
    }
    
    return NO;
}

- (NSError*) verifyNetworkOperation:(id<BNCNetworkOperationProtocol>)operation {

    if (!operation) {
        NSString *message = BNCLocalizedString(
            @"A network operation instance is expected to be returned by the"
             " networkOperationWithURLRequest:completion: method."
        );
        NSError *error = [NSError branchErrorWithCode:BNCNetworkServiceInterfaceError localizedMessage:message];
        return error;
    }
    if (![operation conformsToProtocol:@protocol(BNCNetworkOperationProtocol)]) {
        NSString *message =
            BNCLocalizedFormattedString(
                @"Network operation of class '%@' does not conform to the BNCNetworkOperationProtocol.",
                NSStringFromClass([operation class]));
        NSError *error = [NSError branchErrorWithCode:BNCNetworkServiceInterfaceError localizedMessage:message];
        return error;
    }
    if (!operation.startDate) {
        NSString *message = BNCLocalizedString(
            @"The network operation start date is not set. The Branch SDK expects the network operation"
             " start date to be set by the network provider."
        );
        NSError *error = [NSError branchErrorWithCode:BNCNetworkServiceInterfaceError localizedMessage:message];
        return error;
    }
    if (!operation.timeoutDate) {
        NSString*message = BNCLocalizedString(
            @"The network operation timeout date is not set. The Branch SDK expects the network operation"
             " timeout date to be set by the network provider."
        );
        NSError *error = [NSError branchErrorWithCode:BNCNetworkServiceInterfaceError localizedMessage:message];
        return error;
    }
    if (!operation.request) {
        NSString *message = BNCLocalizedString(
            @"The network operation request is not set. The Branch SDK expects the network operation"
             " request to be set by the network provider."
        );
        NSError *error = [NSError branchErrorWithCode:BNCNetworkServiceInterfaceError localizedMessage:message];
        return error;
    }
    return nil;
}

- (BNCServerResponse *)genericHTTPRequestSynchronous:(NSURLRequest *)request {

    __block BNCServerResponse *serverResponse = nil;
    dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);

    id<BNCNetworkOperationProtocol> operation =
        [self.networkService
            networkOperationWithURLRequest:request.copy
            completion:^void (id<BNCNetworkOperationProtocol>operation) {
                serverResponse =
                    [self processServerResponse:operation.response
                        data:operation.responseData error:operation.error];
                [self collectInstrumentationMetricsWithOperation:operation];                    
                dispatch_semaphore_signal(semaphore);
            }];
    [operation start];
    NSError *error = [self verifyNetworkOperation:operation];
    if (!error) {
        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
    }
    return serverResponse;
}

#pragma mark - Internals

- (NSURLRequest *)prepareGetRequest:(NSDictionary *)params
                                url:(NSString *)url
                                key:(NSString *)key
                        retryNumber:(NSInteger)retryNumber {

    NSDictionary *preparedParams =
        [self prepareParamDict:params key:key retryNumber:retryNumber requestType:@"GET"];
    NSString *requestUrlString =
        [NSString stringWithFormat:@"%@%@", url, [BNCEncodingUtils encodeDictionaryToQueryString:preparedParams]];
    BNCLogDebug(@"URL: %@", requestUrlString);

    NSMutableURLRequest *request =
        [NSMutableURLRequest requestWithURL:[NSURL URLWithString:requestUrlString]
            cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
            timeoutInterval:self.preferenceHelper.timeout];
    [request setHTTPMethod:@"GET"];
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    
    return request;
}

- (NSURLRequest *)preparePostRequest:(NSDictionary *)params
                                 url:(NSString *)url
                                 key:(NSString *)key
                         retryNumber:(NSInteger)retryNumber {

    NSMutableDictionary *preparedParams =
        [self prepareParamDict:params key:key retryNumber:retryNumber requestType:@"POST"];
    if ([self isV2APIURL:url]) {
        preparedParams[@"sdk"] = nil;
    }
    if (Branch.trackingDisabled) {
        preparedParams[@"tracking_disabled"] = (__bridge NSNumber*) kCFBooleanTrue;
        preparedParams[@"local_ip"] = nil;
        preparedParams[@"lastest_update_time"] = nil;
        preparedParams[@"previous_update_time"] = nil;
        preparedParams[@"latest_install_time"] = nil;
        preparedParams[@"first_install_time"] = nil;
        preparedParams[@"ios_vendor_id"] = nil;
        preparedParams[@"hardware_id"] = nil;
        preparedParams[@"hardware_id_type"] = nil;
        preparedParams[@"is_hardware_id_real"] = nil;
        preparedParams[@"device_fingerprint_id"] = nil;
        preparedParams[@"identity_id"] = nil;
        preparedParams[@"identity"] = nil;
        preparedParams[@"update"] = nil;
    }
    NSData *postData = [BNCEncodingUtils encodeDictionaryToJsonData:preparedParams];
    NSString *postLength = [NSString stringWithFormat:@"%lu", (unsigned long)[postData length]];

    BNCLogDebug(@"URL: %@.", url);
    BNCLogDebug(@"Body: %@\nJSON: %@.",
        preparedParams,
        [[NSString alloc] initWithData:postData encoding:NSUTF8StringEncoding]
    );
    
    NSMutableURLRequest *request =
        [NSMutableURLRequest requestWithURL:[NSURL URLWithString:url]
            cachePolicy:NSURLRequestReloadIgnoringLocalCacheData
            timeoutInterval:self.preferenceHelper.timeout];
    [request setHTTPMethod:@"POST"];
    [request setValue:postLength forHTTPHeaderField:@"Content-Length"];
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    [request setHTTPBody:postData];
    
    return request;
}

- (NSMutableDictionary *)prepareParamDict:(NSDictionary *)params
							   key:(NSString *)key
					   retryNumber:(NSInteger)retryNumber
                       requestType:(NSString *)reqType {

    NSMutableDictionary *fullParamDict = [[NSMutableDictionary alloc] init];
    [fullParamDict bnc_safeAddEntriesFromDictionary:params];
    fullParamDict[@"sdk"] = [NSString stringWithFormat:@"ios%@", BNC_SDK_VERSION];
    
    // using rangeOfString instead of containsString to support devices running pre iOS 8
    if ([[[NSBundle mainBundle] executablePath] rangeOfString:@".appex/"].location != NSNotFound) {
        fullParamDict[@"ios_extension"] = @(1);
    }
    fullParamDict[@"retryNumber"] = @(retryNumber);
    fullParamDict[@"branch_key"] = key;

    NSMutableDictionary *metadata = [[NSMutableDictionary alloc] init];
    [metadata bnc_safeAddEntriesFromDictionary:self.preferenceHelper.requestMetadataDictionary];
    [metadata bnc_safeAddEntriesFromDictionary:fullParamDict[BRANCH_REQUEST_KEY_STATE]];
    if (metadata.count) {
        fullParamDict[BRANCH_REQUEST_KEY_STATE] = metadata;
    }
    // we only send instrumentation info in the POST body request
    if (self.preferenceHelper.instrumentationDictionary.count && [reqType isEqualToString:@"POST"]) {
        fullParamDict[BRANCH_REQUEST_KEY_INSTRUMENTATION] = self.preferenceHelper.instrumentationDictionary;
    }
   
    return fullParamDict;
}

- (BNCServerResponse *)processServerResponse:(NSURLResponse *)response
                                        data:(NSData *)data
                                       error:(NSError *)error {
    BNCServerResponse *serverResponse = [[BNCServerResponse alloc] init];
    if (!error) {
        serverResponse.statusCode = @([(NSHTTPURLResponse *)response statusCode]);
        serverResponse.data = [BNCEncodingUtils decodeJsonDataToDictionary:data];
    }
    else {
        serverResponse.statusCode = @(error.code);
        serverResponse.data = error.userInfo;
    }
    BNCLogDebug(@"Server returned: %@.", serverResponse);
    return serverResponse;
}

- (void) collectInstrumentationMetricsWithOperation:(id<BNCNetworkOperationProtocol>)operation {
    // multiplying by negative because startTime happened in the past
    NSTimeInterval elapsedTime = [operation.startDate timeIntervalSinceNow] * -1000.0;
    NSString *lastRoundTripTime = [[NSNumber numberWithDouble:floor(elapsedTime)] stringValue];
    NSString * brttKey = [NSString stringWithFormat:@"%@-brtt", self.requestEndpoint];
    [self.preferenceHelper clearInstrumentationDictionary];
    [self.preferenceHelper addInstrumentationDictionaryKey:brttKey value:lastRoundTripTime];
}

- (void)updateDeviceInfoToMutableDictionary:(NSMutableDictionary *)dict {
    BNCDeviceInfo *deviceInfo  = [BNCDeviceInfo getInstance];

    NSString *hardwareId = [deviceInfo.hardwareId copy];
    NSString *hardwareIdType = [deviceInfo.hardwareIdType copy];
    NSNumber *isRealHardwareId = @(deviceInfo.isRealHardwareId);
    if (hardwareId != nil && hardwareIdType != nil && isRealHardwareId != nil) {
        dict[BRANCH_REQUEST_KEY_HARDWARE_ID] = hardwareId;
        dict[BRANCH_REQUEST_KEY_HARDWARE_ID_TYPE] = hardwareIdType;
        dict[BRANCH_REQUEST_KEY_IS_HARDWARE_ID_REAL] = isRealHardwareId;
    }
    
    [self safeSetValue:deviceInfo.vendorId forKey:BRANCH_REQUEST_KEY_IOS_VENDOR_ID onDict:dict];
    [self safeSetValue:deviceInfo.brandName forKey:BRANCH_REQUEST_KEY_BRAND onDict:dict];
    [self safeSetValue:deviceInfo.modelName forKey:BRANCH_REQUEST_KEY_MODEL onDict:dict];
    [self safeSetValue:deviceInfo.osName forKey:BRANCH_REQUEST_KEY_OS onDict:dict];
    [self safeSetValue:deviceInfo.osVersion forKey:BRANCH_REQUEST_KEY_OS_VERSION onDict:dict];
    [self safeSetValue:deviceInfo.screenWidth forKey:BRANCH_REQUEST_KEY_SCREEN_WIDTH onDict:dict];
    [self safeSetValue:deviceInfo.screenHeight forKey:BRANCH_REQUEST_KEY_SCREEN_HEIGHT onDict:dict];

    [self safeSetValue:deviceInfo.browserUserAgent forKey:@"user_agent" onDict:dict];
    [self safeSetValue:deviceInfo.country forKey:@"country" onDict:dict];
    [self safeSetValue:deviceInfo.language forKey:@"language" onDict:dict];
    dict[@"local_ip"] = deviceInfo.localIPAddress;

    dict[BRANCH_REQUEST_KEY_AD_TRACKING_ENABLED] = @(deviceInfo.isAdTrackingEnabled);
}

- (NSMutableDictionary*)updateDeviceInfoToParams:(NSDictionary *)params {
    NSMutableDictionary *extendedParams=[[NSMutableDictionary alloc] init];
    [extendedParams addEntriesFromDictionary:params];
    [self updateDeviceInfoToMutableDictionary:extendedParams];
    return extendedParams;
}

- (void)safeSetValue:(NSObject *)value forKey:(NSString *)key onDict:(NSMutableDictionary *)dict {
    if (value) {
        dict[key] = value;
    }
}

@end
