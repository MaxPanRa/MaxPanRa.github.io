
let $pre = $('pre');
  let $button = $('button');
  let auth = firebase.auth();
  
  auth.onAuthStateChanged(user => {
    $button.prop('disabled', false);
    if( user ) {
    	$pre.text( JSON.stringify(user, null, 2) );
      $button.text('Sign Out');
    }
    else {
    	$pre.text('Not signed in');
      $button.text('Sign In');
    }
  });
  
  function toggle() {
  	if( $button.text() === 'Sign In' ) {
      $button.prop('disabled', true);
    	var provider = new firebase.auth.GoogleAuthProvider();
			provider.addScope('https://www.googleapis.com/auth/plus.login');
      auth.signInWithPopup(provider).catch(e => {
        $button.prop('disabled', false);
      	$pre.text(JSON.stringify(e, null, 2));
      });
    }
    else {
    	auth.signOut();
    }
  }
  
  $button.click(toggle);