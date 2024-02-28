
class LookerSession {
  
    
} 


export const login = async ()=>{
  console.log("1");
  oauth_login();
  /*  
  const myHeaders = new Headers();
  myHeaders.append("Cookie", "CSRF-TOKEN=lwZylQ8C0gSQX6%2FDi89t2V4jarAkQM1TM%2FCN%2BjRP0KU%3D;");

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    redirect: "follow"
  };

  const sessionJSON = await fetch("https://gtechdev.cloud.looker.com/api/4.0/login?client_id=jcxxgpnztjRVjCvjCMkk&client_secret=stSFJD7kvvFdfqBsxpKYNDq7", requestOptions)
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));
  console.log("SJson: "+sessionJSON);
*/
}

async function oauth_login() {
  const code_verifier = secure_random(32)
  const code_challenge = await sha256_hash(code_verifier)
  const base_url = "https://gtechdev.cloud.looker.com";
  const params = {
    response_type: 'code',
    client_id: '22',
    redirect_uri: 'https://maxpanra.github.io',
    scope: 'cors_api',
    state: '1235813',
    code_challenge_method: 'S256',
    code_challenge: code_challenge,
  }
  const url = `${base_url}?${new URLSearchParams(params).toString()}` // Replace base_url with your full Looker instance's UI host URL, plus the `/auth` endpoint.
  console.log(url)

  // Stash the code verifier we created in sessionStorage, which
  // will survive page loads caused by login redirects
  // The code verifier value is needed after the login redirect
  // to redeem the auth_code received for an access_token
  //
  sessionStorage.setItem('code_verifier', code_verifier)

  document.location = url
}

function array_to_hex(array) {
  return Array.from(array).map(b => b.toString(16).padStart(2,'0')).join('')
}

function secure_random(byte_count) {
  const array = new Uint8Array(byte_count);
  crypto.getRandomValues(array);
  return array_to_hex(array)
}

async function sha256_hash(message) {
  const msgUint8 = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  return base64(hashBuffer);  // Refers to the implementation of base64.encode stored at https://gist.github.com/jhurliman/1250118
}

function base64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

function utf8(str) {
  return decodeURIComponent(escape(window.atob(str)));
}