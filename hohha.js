// This could be cleaned up and modularized...

//----------------------------------------------------------------------
// javascript bit ops are a pain...

function u8(x) { return x & 0xff; }
function not32(x) { return ~x >>> 0; }
function and32(x, y) { return (x & y) >>> 0; }
function or32(x, y) { return (x | y) >>> 0; }
function xor32(x, y) { return (x ^ y) >>> 0; }
function bsl32(x, n) { return (x << n) >>> 0; }
function bsr32(x, n) { return x >>> n }
function rol32(x, n) { return or32(bsl32(x, n), bsr32(x, 32 - n)); }
function ror32(x, n) { return or32(bsr32(x, n), bsl32(x, 32 - n)); }

// make an integer out of bytes
function cpu32(w, x, y, z) {
	return or32(or32(or32(w, bsl32(x, 8)), bsl32(y, 16)), bsl32(z, 24));
}

//----------------------------------------------------------------------
// a simple crc32 implementation

var crc32table = new Uint32Array([
	0x00000000, 0xf26b8303, 0xe13b70f7, 0x1350f3f4,
	0xc79a971f, 0x35f1141c, 0x26a1e7e8, 0xd4ca64eb,
	0x8ad958cf, 0x78b2dbcc, 0x6be22838, 0x9989ab3b,
	0x4d43cfd0, 0xbf284cd3, 0xac78bf27, 0x5e133c24,
	0x105ec76f, 0xe235446c, 0xf165b798, 0x030e349b,
	0xd7c45070, 0x25afd373, 0x36ff2087, 0xc494a384,
	0x9a879fa0, 0x68ec1ca3, 0x7bbcef57, 0x89d76c54,
	0x5d1d08bf, 0xaf768bbc, 0xbc267848, 0x4e4dfb4b,
	0x20bd8ede, 0xd2d60ddd, 0xc186fe29, 0x33ed7d2a,
	0xe72719c1, 0x154c9ac2, 0x061c6936, 0xf477ea35,
	0xaa64d611, 0x580f5512, 0x4b5fa6e6, 0xb93425e5,
	0x6dfe410e, 0x9f95c20d, 0x8cc531f9, 0x7eaeb2fa,
	0x30e349b1, 0xc288cab2, 0xd1d83946, 0x23b3ba45,
	0xf779deae, 0x05125dad, 0x1642ae59, 0xe4292d5a,
	0xba3a117e, 0x4851927d, 0x5b016189, 0xa96ae28a,
	0x7da08661, 0x8fcb0562, 0x9c9bf696, 0x6ef07595,
	0x417b1dbc, 0xb3109ebf, 0xa0406d4b, 0x522bee48,
	0x86e18aa3, 0x748a09a0, 0x67dafa54, 0x95b17957,
	0xcba24573, 0x39c9c670, 0x2a993584, 0xd8f2b687,
	0x0c38d26c, 0xfe53516f, 0xed03a29b, 0x1f682198,
	0x5125dad3, 0xa34e59d0, 0xb01eaa24, 0x42752927,
	0x96bf4dcc, 0x64d4cecf, 0x77843d3b, 0x85efbe38,
	0xdbfc821c, 0x2997011f, 0x3ac7f2eb, 0xc8ac71e8,
	0x1c661503, 0xee0d9600, 0xfd5d65f4, 0x0f36e6f7,
	0x61c69362, 0x93ad1061, 0x80fde395, 0x72966096,
	0xa65c047d, 0x5437877e, 0x4767748a, 0xb50cf789,
	0xeb1fcbad, 0x197448ae, 0x0a24bb5a, 0xf84f3859,
	0x2c855cb2, 0xdeeedfb1, 0xcdbe2c45, 0x3fd5af46,
	0x7198540d, 0x83f3d70e, 0x90a324fa, 0x62c8a7f9,
	0xb602c312, 0x44694011, 0x5739b3e5, 0xa55230e6,
	0xfb410cc2, 0x092a8fc1, 0x1a7a7c35, 0xe811ff36,
	0x3cdb9bdd, 0xceb018de, 0xdde0eb2a, 0x2f8b6829,
	0x82f63b78, 0x709db87b, 0x63cd4b8f, 0x91a6c88c,
	0x456cac67, 0xb7072f64, 0xa457dc90, 0x563c5f93,
	0x082f63b7, 0xfa44e0b4, 0xe9141340, 0x1b7f9043,
	0xcfb5f4a8, 0x3dde77ab, 0x2e8e845f, 0xdce5075c,
	0x92a8fc17, 0x60c37f14, 0x73938ce0, 0x81f80fe3,
	0x55326b08, 0xa759e80b, 0xb4091bff, 0x466298fc,
	0x1871a4d8, 0xea1a27db, 0xf94ad42f, 0x0b21572c,
	0xdfeb33c7, 0x2d80b0c4, 0x3ed04330, 0xccbbc033,
	0xa24bb5a6, 0x502036a5, 0x4370c551, 0xb11b4652,
	0x65d122b9, 0x97baa1ba, 0x84ea524e, 0x7681d14d,
	0x2892ed69, 0xdaf96e6a, 0xc9a99d9e, 0x3bc21e9d,
	0xef087a76, 0x1d63f975, 0x0e330a81, 0xfc588982,
	0xb21572c9, 0x407ef1ca, 0x532e023e, 0xa145813d,
	0x758fe5d6, 0x87e466d5, 0x94b49521, 0x66df1622,
	0x38cc2a06, 0xcaa7a905, 0xd9f75af1, 0x2b9cd9f2,
	0xff56bd19, 0x0d3d3e1a, 0x1e6dcdee, 0xec064eed,
	0xc38d26c4, 0x31e6a5c7, 0x22b65633, 0xd0ddd530,
	0x0417b1db, 0xf67c32d8, 0xe52cc12c, 0x1747422f,
	0x49547e0b, 0xbb3ffd08, 0xa86f0efc, 0x5a048dff,
	0x8ecee914, 0x7ca56a17, 0x6ff599e3, 0x9d9e1ae0,
	0xd3d3e1ab, 0x21b862a8, 0x32e8915c, 0xc083125f,
	0x144976b4, 0xe622f5b7, 0xf5720643, 0x07198540,
	0x590ab964, 0xab613a67, 0xb831c993, 0x4a5a4a90,
	0x9e902e7b, 0x6cfbad78, 0x7fab5e8c, 0x8dc0dd8f,
	0xe330a81a, 0x115b2b19, 0x020bd8ed, 0xf0605bee,
	0x24aa3f05, 0xd6c1bc06, 0xc5914ff2, 0x37faccf1,
	0x69e9f0d5, 0x9b8273d6, 0x88d28022, 0x7ab90321,
	0xae7367ca, 0x5c18e4c9, 0x4f48173d, 0xbd23943e,
	0xf36e6f75, 0x0105ec76, 0x12551f82, 0xe03e9c81,
	0x34f4f86a, 0xc69f7b69, 0xd5cf889d, 0x27a40b9e,
	0x79b737ba, 0x8bdcb4b9, 0x988c474d, 0x6ae7c44e,
	0xbe2da0a5, 0x4c4623a6, 0x5f16d052, 0xad7d5351
]);

function crc32_byte(x, w) {
	return xor32(crc32table[xor32(u8(w), bsr32(x, 24))], bsl32(x, 8));
}

function crc32_data(d) {
	var c = not32(0);

	for (var i = 0; i < d.length; ++i) {
		c = crc32_byte(c, d[i]);
	}

	return not32(c);
}

//----------------------------------------------------------------------
// Here is the refactored hohha dynamic xor algorithm

function hxJump0(hx) {
	hx.s1 = xor32(hx.s1, hx.key[hx.m]);
	hx.key[hx.m] = u8(hx.s2);
	hx.m = xor32(hx.m, hx.s2) % hx.key.length;
	hx.s2 = rol32(hx.s2, 1);
}

function hxJump1(hx) {
	hx.s2 = xor32(hx.s2, hx.key[hx.m]);
	hx.key[hx.m] = u8(hx.s1);
	hx.m = xor32(hx.m, hx.v) % hx.key.length;
	hx.s1 = ror32(hx.s1, 1);
}

function hxJump2(hx) {
	hx.s1 = xor32(hx.s1, hx.key[hx.m]);
	hx.key[hx.m] = u8(hx.s2);
	hx.m = xor32(hx.m, hx.v) % hx.key.length;
	hx.s2 = rol32(hx.s2, 1);
}

function hxJump3(hx) {
	hx.s2 = xor32(hx.s2, hx.key[hx.m]);
	hx.key[hx.m] = u8(hx.s1);
	hx.m = xor32(hx.m, hx.s1) % hx.key.length;
	hx.s1 = ror32(hx.s1, 1);
}

function hxJump(hx) {
	var j = 1, jumps = hx.key_jumps;

	hxJump0(hx);
	hxJump1(hx);
	while (true) {
		if (++j == jumps) break;
		hxJump2(hx);
		if (++j == jumps) break;
		hxJump3(hx);
	}

	return xor32(xor32(hx.v, hx.s1), hx.s2);
}

function hxStep(hx, w) {
	hx.cs = crc32_byte(hx.cs, w);
	hx.v = rol32(hx.v ^ hx.cs, 1);
}

function hxEncr(hx, buf, out) {
	if (buf.length != out.length) throw "invalid length";

	for (var i = 0; i < buf.length; ++i) {
		var x = hxJump(hx);
		hxStep(hx, buf[i]);
		out[i] = u8(buf[i] ^ x);
	}
}

function hxDecr(hx, buf, out) {
	if (buf.length != out.length) throw "invalid length";

	for (var i = 0; i < buf.length; ++i) {
		var x = hxJump(hx);
		out[i] = buf[i] ^ x;
		hxStep(hx, out[i]);
	}
}

//----------------------------------------------------------------------
// Helpers for initializing state and calling the algorithm

function hxHelperInit(key, salt) {
	var hx = {};

	var key_length = key[1] | (key[2] << 8);
	hx.key = key.slice(11);
	if (hx.key.length != key_length) throw "invalid key";

	hx.key_jumps = key[0];
	if (hx.key_jumps < 2) throw "invalid key";

	hx.s1 = cpu32(salt[0], salt[1], salt[2], salt[3]);
	hx.s2 = cpu32(salt[4], salt[5], salt[6], salt[7]);
	hx.m = ((salt[3] * salt[7]) >>> 0) % hx.key.length;
	hx.cs = not32(0);
	hx.v = crc32_data(hx.key);

	return hx;
}

function hxHelperEncrypt(key, salt, msg) {
	var hx = hxHelperInit(key, salt);
	hxEncr(hx, msg, msg);
	return not32(hx.cs);
}

function hxHelperDecrypt(key, salt, msg) {
	var hx = hxHelperInit(key, salt);
	hxDecr(hx, msg, msg);
	return not32(hx.cs);
}
