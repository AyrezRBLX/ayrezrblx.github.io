// Utilitários de WebAuthn (passkeys) que rodam no Cloudflare Worker, só com WebCrypto.
export const enc = new TextEncoder()
export const dec = new TextDecoder()

export const b64u = {
  enc: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
}

export const sha256 = async (data) =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc.encode(data) : data))

// A assinatura ECDSA do WebAuthn vem em DER; o WebCrypto espera r||s (64 bytes)
export const derToRaw = (der) => {
  let i = 2
  const readInt = () => {
    i++
    const len = der[i++]
    let v = der.slice(i, i + len)
    i += len
    while (v.length > 32 && v[0] === 0) v = v.slice(1)
    const out = new Uint8Array(32)
    out.set(v, 32 - v.length)
    return out
  }
  const r = readInt()
  const s = readInt()
  const raw = new Uint8Array(64)
  raw.set(r, 0)
  raw.set(s, 32)
  return raw
}

// Exige "user present" (bit 0) e "user verified" (bit 2): biometria ou PIN
export const flagsOk = (authData) => authData.length >= 37 && (authData[32] & 1) === 1 && (authData[32] & 4) === 4

export const verifySignature = async (cred, authData, clientDataJSON, signature) => {
  const hash = await sha256(clientDataJSON)
  const data = new Uint8Array(authData.length + 32)
  data.set(authData)
  data.set(hash, authData.length)
  const spki = b64u.dec(cred.pub)
  if (cred.alg === -7) {
    const key = await crypto.subtle.importKey('spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, derToRaw(signature), data)
  }
  if (cred.alg === -257) {
    const key = await crypto.subtle.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, data)
  }
  return false
}
