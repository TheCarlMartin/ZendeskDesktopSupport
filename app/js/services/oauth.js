//Require Browser Module
var remote = require('remote');
var BrowserWindow = remote.require('browser-window');



function removeCookies(appWindow, close) {
  appWindow.webContents.session.cookies.get({}, function(error, cookies) {
    if (error) throw error;
    for (var i = cookies.length - 1; i >= 0; i--) {
      var url = "http" + (cookies[i].secure ? "s" : "") + "://" + cookies[i].domain + cookies[i].path;
      appWindow.webContents.session.cookies.remove({
              "url": url,
              "name": cookies[i].name
          },
          function(error) {
              if (error) throw error;
          });
    };
    if (close === 'true') {
      appWindow.close();
    }
  });
}



function zendeskOAuth() {

  loading(true, '');

  // Zendesk Application credentials
  var options = {
      client_id: 'desktop_support',
      client_secret: '7632ff63f7e706fdf395fc014ec35541ab7cd34a8075e00a2598d2614ca654f6', //For security reasons I omitted the client secret
      scope: "read%20write", // Scopes limit access for OAuth tokens.
      redirectURI: 'https://www.annett-martin.de'
  };

  //Check that a Zendesk Subdomain has been entered.
  if(document.getElementById("subdomain-field").value === '' || document.getElementById("subdomain-field").value === 'beispiel') {
    return;
  } else {
    var zendeskSubdomain = document.getElementById("subdomain-field").value;
  }

  //Store value of Signed in Checkbox
  var staySignedInDecision = document.getElementById("staySignedIn").checked;
  localStorage.setItem('staySignedIn', staySignedInDecision);

  // Build the OAuth Consent Window
  var authWindow = new BrowserWindow({
      height: 800,
      width: 600,
      show: false,
      alwaysOnTop: true
  });

  //Build OAuth URL
  var zendeskURL = 'https://' + zendeskSubdomain + '.zendesk.com/oauth/authorizations/';
  var authUrl = zendeskURL + 'new?response_type=code&redirect_uri=' + options.redirectURI + '&client_id=' + options.client_id + '&scope=' + options.scope;

  removeCookies(authWindow, 'false');
  authWindow.loadURL(authUrl);
  authWindow.show();

  // Handle the response from Zendesk
  authWindow.webContents.on('did-get-redirect-request', function(event, oldUrl, newUrl) {

    var raw_code = /code=([^&]*)/.exec(newUrl) || null,
      code = (raw_code && raw_code.length > 1) ? raw_code[1] : null,
      error = /\?error=(.+)$/.exec(newUrl);

    if (code || error) {
      //Removes Cookies and closes the Window
      removeCookies(authWindow, 'true');

    }

    // If there is a code in the callback, proceed to get token from Zendesk
    if (code) {
      requestZendeskToken(options, code);
    } else if (error) {
      alert("Leider ist ein Fehler aufgetreten. Wir konnten Sie deshalb nicht mit Zendesk anmelden. Bitte versuchen Sie es erneut oder kontaktieren Sie Ihren Administrator.");
    }

  });

  // Reset the authWindow on close
  authWindow.on('close', function() {
      authWindow = null;
      loading(false, '');
  }, false);
}

function requestZendeskToken(zendeskOptions, authCode) {
  var tokenExchange = new XMLHttpRequest();
  var zendeskSubdomain = document.getElementById("subdomain-field").value;
  var tokenURL = 'https://' + zendeskSubdomain + '.zendesk.com/oauth/tokens';
  var tokenOptions = JSON.stringify({
    grant_type: 'authorization_code',
    code: authCode,
    client_id: zendeskOptions.client_id,
    client_secret: zendeskOptions.client_secret,
    redirect_uri: zendeskOptions.redirectURI,
    scope: 'read'
  });

  tokenExchange.onreadystatechange = function() {
    if (tokenExchange.readyState == 4 && tokenExchange.status == 200) {
      var response = JSON.parse(tokenExchange.responseText);
      localStorage.setItem('code', response.access_token);
      localStorage.setItem('subdomain', document.getElementById("subdomain-field").value);
      console.log(response.access_token);
      console.log(localStorage.getItem('code'));
      console.log(localStorage.getItem('subdomain'));
      requestUserInfo();
    }
  };

  tokenExchange.open('POST', tokenURL, true);
  tokenExchange.setRequestHeader("Content-Type", "application/json");
  tokenExchange.send(tokenOptions);
}
