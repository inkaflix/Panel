let accessToken = "";

function handleCredentialResponse(response) {
  const client = google.accounts.oauth2.initTokenClient({
    client_id: '155693540835-c5528m80r913cahna97nmg7t834pgaub.apps.googleusercontent.com',
    scope: 'https://www.googleapis.com/auth/blogger',
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      document.getElementById("logout").style.display = "block";
    },
  });
  client.requestAccessToken();
}

window.onload = function () {
  google.accounts.id.initialize({
    client_id: '155693540835-c5528m80r913cahna97nmg7t834pgaub.apps.googleusercontent.com',
    callback: handleCredentialResponse
  });
  google.accounts.id.renderButton(
    document.getElementById("login"),
    { theme: "outline", size: "large" }
  );
  document.getElementById("logout").onclick = () => {
    accessToken = "";
    alert("Sesión cerrada");
    location.reload();
  };
};
