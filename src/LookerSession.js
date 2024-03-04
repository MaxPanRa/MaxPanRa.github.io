import { CLIENT_GUID, LOOKER_WEB, REDIRECT_URI, TOKEN } from "./Constants";
import {Base64} from "./Base64";
import React, { useState } from "react";

export async function oauth_login() {

  const code_ver = sessionStorage.getItem('code_verifier');
  if (code_ver ) {
    if(TOKEN == ""){
      sessionStorage.removeItem('code_verifier');
    }else{
      return;
    }
  }
  const code_verifier = secure_random(32)
  const code_challenge = await sha256_hash(code_verifier)
  const base_url = LOOKER_WEB+"auth";
  const params = { 
    response_type: 'code',
    client_id: CLIENT_GUID,
    redirect_uri: REDIRECT_URI,
    scope: 'cors_api',
    state: '1235813',
    code_challenge_method: 'S256',
    code_challenge: code_challenge,
  }
  const url = `${base_url}?${new URLSearchParams(params).toString()}` // Replace base_url with your full Looker instance's UI host URL, plus the `/auth` endpoint.
  
  sessionStorage.setItem('code_verifier', code_verifier)
  console.log("CODE VERIFIER ANTES: "+code_verifier);
  document.location = url;
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
  return Base64.urlEncode(hashBuffer);  // Refers to the implementation of base64.encode stored at https://gist.github.com/jhurliman/1250118
}

export async function redeem_auth_code(response_str) {
  const params = new URLSearchParams(response_str)
  const auth_code = params.get('code')

  if (!auth_code) {
    console.log('ERROR: No authorization code in response')
    return
  }
  //console.log(`auth code received: ${auth_code}`)
  //console.log(`state: ${params.get('state')}`)

  const code_verifier = sessionStorage.getItem('code_verifier')
  if (!code_verifier) {
    console.log('ERROR: Missing code_verifier in session storage')
    return
  }
  sessionStorage.removeItem('code_verifier')
  
  //console.log('CODE VERIFIER:'+code_verifier);
  //console.log('AUTH CODE:'+auth_code);
  console.log(JSON.stringify({
    grant_type: 'authorization_code',
    client_id: CLIENT_GUID,
    redirect_uri: REDIRECT_URI,
    code: auth_code,
    code_verifier: code_verifier,
  }));
  const response = await
  fetch(LOOKER_WEB+"api/token", {  // This is the URL of your Looker instance's API web service
    method: 'POST',
    mode: 'cors',    // This line is required so that the browser will attempt a CORS request.
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: CLIENT_GUID,
      redirect_uri: REDIRECT_URI,
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
  console.log(`API/TOKEN RESPONSE: ${response}`)
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