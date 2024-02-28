
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
  const base_url = "https://gtechdev.cloud.looker.com/auth";
  const params = {
    response_type: 'code',
    client_id: '561326193392-71u84huibkpfu36g6hfmfdlnc5hg781v.apps.googleusercontent.com',
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

  //document.location = url
  redeem_auth_code("code=AgEMAAFAI8txJscJVL8ZAC8BxpolqofXzsK2GgT_HrDaqWmgarTQKniE56P9naWgVvubgVq9aDqprDhxZ3hrTgDVE6lONCULS8-q1A1FaNubgSo9pLUXQduenBTJxojwr8-pSXQyTMWORns4uxUwzS1-ZeEWHzZrQuwinO5WFMRg_ZE3KJiMHpy2RjJpwBxAY2iYmxFWj-HOAy4xn1hsRPcMudkVsj8S3NDBA7V5-zIq6AQCAIio0HHIJBlVvA9TO6n7q4VxDFjpztLjNn9FwwgRkT1HJd044foLXroARCQv6l3aOT559hwdAabgdlPx67cdz9VLRSWsUAn4Zr0RUrnEvcYMpYxIXXTpqWuRTZtEcp56PCgbDRVRftjBpX2dWurP5C1DKvY8mXPskLE1ws-ILov0yhxIHi3nbHIEKPgwyqrcGcdbhbNJaWJnqXYfH6Ev227jEKRL4XMRXYbWL6LP3dTTnNkWTfBmBmdVZWf77gN-ovoJl795PulS9m4CpYiYmZcsJg&state=1235813");
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

async function redeem_auth_code(response_str) {
  const params = new URLSearchParams(response_str)
  const auth_code = params.get('code')

  if (!auth_code) {
    console.log('ERROR: No authorization code in response')
    return
  }
  console.log(`auth code received: ${auth_code}`)
  console.log(`state: ${params.get('state')}`)

  const code_verifier = sessionStorage.getItem('code_verifier')
  if (!code_verifier) {
    console.log('ERROR: Missing code_verifier in session storage')
    return
  }
  sessionStorage.removeItem('code_verifier')
  const response = await
  fetch('https://gtechdev.cloud.looker.com/api/token', {  // This is the URL of your Looker instance's API web service
    method: 'POST',
    mode: 'cors',    // This line is required so that the browser will attempt a CORS request.
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: '561326193392-71u84huibkpfu36g6hfmfdlnc5hg781v.apps.googleusercontent.com',
      redirect_uri: 'https://maxpanra.github.io',
      code: auth_code,
      code_verifier: code_verifier,
    }),
    headers: {
      'x-looker-appid': 'Web App Auth & CORS API Demo', // This header is optional.
      'Content-Type': 'application/json;charset=UTF-8'  // This header is required.
    },
  }).catch((error) => {
    console.log(`Error: ${error.message}`)
  })

  const info = await response.json()
  console.log(`/api/token response: ${JSON.stringify(info)}`)

  // Store the access_token and other info,
  // which in this example is done in sessionStorage

  const expires_at = new Date(Date.now() + (info.expires_in * 1000))
  info.expires_at = expires_at
  console.log(`Access token expires at ${expires_at.toLocaleTimeString()} local time.`)
  sessionStorage.setItem('access_info', JSON.stringify(info))
  console.log(sessionStorage.getItem('access_info'));
  
}