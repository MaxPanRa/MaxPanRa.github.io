export let Buffer = require("buffer").Buffer

export const Base64 ={

    encode(unencoded) {
    return new Buffer(unencoded || '').toString('base64');
    },

    decode(encoded) {
    return new Buffer(encoded || '', 'base64').toString('utf8');
    },

    urlEncode(unencoded) {
    var encoded = Base64.encode(unencoded);
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },

    urlDecode(encoded) {
    encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (encoded.length % 4)
        encoded += '=';
    return Base64.decode(encoded);
    }
}