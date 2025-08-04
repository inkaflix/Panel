<!-- Cargar el cliente OAuth2 -->
<script src="https://accounts.google.com/gsi/client" async defer></script>

<!-- Botones de login/logout -->
<div id="login">
  <button id="loginButton">Iniciar sesión con Google</button>
</div>
<button id="logout" style="display:none;">Cerrar sesión</button>

<script>
  let accessToken = "";
  let tokenClient;

  window.onload = function () {
    // Inicializar el cliente de token
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: '155693540835-c5528m80r913cahna97nmg7t834pgaub.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/blogger',
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          console.error(tokenResponse);
          alert("Error al iniciar sesión");
          return;
        }
        accessToken = tokenResponse.access_token;
        console.log("Access Token:", accessToken);
        document.getElementById("logout").style.display = "block";
        document.getElementById("login").style.display = "none";
        alert("Inicio de sesión exitoso");
        // Aquí puedes continuar con la lógica de publicación a Blogger
      }
    });

    // Evento del botón login
    document.getElementById("loginButton").addEventListener("click", () => {
      tokenClient.requestAccessToken();
    });

    // Evento del botón logout
    document.getElementById("logout").addEventListener("click", () => {
      accessToken = "";
      document.getElementById("logout").style.display = "none";
      document.getElementById("login").style.display = "block";
      alert("Sesión cerrada");
    });
  };
</script>
