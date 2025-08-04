const apiKey = "dc340e81a2bdef1a7bcb0b31358487fd";
const imageBase = "https://image.tmdb.org/t/p/w500";
const backdropBase = "https://image.tmdb.org/t/p/w1280";

// Configura aquí tu Client ID y Blog ID:
const CLIENT_ID = '155693540835-c5528m80r913cahna97nmg7t834pgaub.apps.googleusercontent.com';
  // Ej: 1234567890-abcdefg.apps.googleusercontent.com
const blogId = "3812927193244872888";      // Ej: 1234567890123456789

// Variables globales para autenticación
let accessToken = null;

const movieGrid = document.getElementById("movieGrid");
const discoverBtn = document.getElementById("discoverButton");
const searchBtn = document.getElementById("searchButton");
const searchInput = document.getElementById("searchInput");
const genreSelect = document.getElementById("genreFilter");
const yearSelect = document.getElementById("yearFilter");
const spinner = document.getElementById("loadingSpinner");
const dialog = document.getElementById("movieDialog");
const closeDialog = document.getElementById("closeDialog");
const blurOverlay = document.getElementById("blurOverlay");

const d = id => document.getElementById(id);

let currentPage = 1;
let totalPages = 1;
let currentMode = "discover";
let currentQuery = "";
let currentGenre = "";
let currentYear = "";
let isLoading = false;

// ---- Google Sign-In Setup ----
function initializeGoogleSignIn() {
  google.accounts.id.initialize({
    client_id: clientId,
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("googleSignInButton"),
    { theme: "outline", size: "large" }
  );

  // Opcional: prompt automático
  // google.accounts.id.prompt();
}

// Esta función recibe el token JWT de Google y lo intercambia para obtener un token de acceso OAuth2
async function handleCredentialResponse(response) {
  // response.credential contiene un JWT de Google ID Token
  // Para obtener access token, deberías implementar flujo OAuth2 completo con popup, o usar Google API Client Library.
  // Aquí usaremos la librería Google API para simplificar (asegúrate de incluir <script src="https://apis.google.com/js/api.js"></script> en tu HTML)

  await gapi.load('client:auth2', async () => {
    await gapi.client.init({
      clientId: clientId,
      scope: 'https://www.googleapis.com/auth/blogger'
    });
    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signIn();
    accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
    console.log("Access token obtenido:", accessToken);
  });
}

// ---- Spinner helpers ----
function showSpinner() { spinner.style.display = "block"; }
function hideSpinner() { spinner.style.display = "none"; }

// ---- Fecha formateada ----
function formatDate(dateStr) {
  if (!dateStr) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = new Date(dateStr);
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

// ---- Fetch y mostrar películas ----
function fetchMovies(url, append = false) {
  isLoading = true;
  showSpinner();
  fetch(url)
    .then(res => res.json())
    .then(data => {
      displayMovies(data.results, append);
      totalPages = data.total_pages;
      isLoading = false;
      hideSpinner();
    })
    .catch(() => {
      isLoading = false;
      hideSpinner();
    });
}

function displayMovies(movies, append = false) {
  if (!append) movieGrid.innerHTML = "";
  if (!movies || movies.length === 0) {
    if (!append) movieGrid.innerHTML = "<p style='color:white'>No movies found.</p>";
    return;
  }
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.className = "movie-card";
    const formattedDate = formatDate(movie.release_date);
    card.innerHTML = `
      <img src="${imageBase + movie.poster_path}" alt="${movie.title}" />
      <div class="title">${movie.title}</div>
      <div class="release-date">${formattedDate}</div>
    `;
    card.addEventListener("click", () => showMovieDetails(movie.id));
    movieGrid.appendChild(card);
  });
}

// ---- Mostrar detalles y publicar automáticamente ----
function showMovieDetails(movieId) {
  if (!accessToken) {
    alert("Por favor, inicia sesión con Google para publicar.");
    return;
  }
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=es-ES&append_to_response=videos`;
  fetch(url)
    .then(res => res.json())
    .then(movie => {
      const customId = movie.id; 
      const year = movie.release_date ? movie.release_date.split("-")[0] : "";
      const genres = movie.genres?.map(g => g.name).join(", ") || "";

      const htmlOutput = `
<!-- ${movie.title} -->
<!-- ${genres},Movie,${year} -->

<!-- Post type -->
<div data-post-type="movie" hidden>
  <img src="${imageBase + movie.poster_path}" />
  <p id="tmdb-synopsis">${movie.overview}</p>
</div>

<div class="headline is-small mb-4">
  <h2 class="headline__title">Información</h2>
</div>
<ul class="post-details mb-4"
  data-backdrop="${backdropBase + movie.backdrop_path}"
  data-imdb="${movie.vote_average}">
  <li><span>Título</span> ${movie.title}</li>
  <li><span>Título original</span> ${movie.original_title}</li>
  <li><span>Duración</span> ${movie.runtime || 0} min</li>
  <li><span>Año</span> ${year}</li>
  <li><span>Fecha de estreno</span> ${movie.release_date}</li>
  <li><span>Géneros</span> ${genres}</li>
  <li><span>Estado</span> ${movie.status}</li>
  <li><span>Rating TMDB</span> ${movie.vote_average}</li>
</ul>

<div class="plyer-node" data-selected-lang="lat"></div>
<script>
  const _SV_LINKS = [
    {
      lang: "lat",
      name: "Servers",
      quality: "HD",
      url: "https://streaming.cinedom.pro/api/movie/${customId}",
      tagVideo: false
    }
  ]
</script>
`;

      // Copiar al portapapeles (opcional)
      navigator.clipboard.writeText(htmlOutput);

      // Publicar automáticamente en Blogger
      publicarEnBlogger(movie.title, htmlOutput, genres.split(","));

      // Mostrar diálogo con el HTML
      dialog.querySelector("#dialogContent")?.remove();
      const contentDiv = document.createElement("div");
      contentDiv.id = "dialogContent";
      contentDiv.innerHTML = htmlOutput;
      dialog.appendChild(contentDiv);

      dialog.classList.remove("hidden");
      blurOverlay.classList.remove("hidden");
      blurOverlay.classList.add("show");
    });
}

function publicarEnBlogger(titulo, contenidoHTML, etiquetas) {
  if (!accessToken) {
    alert("Debes iniciar sesión para publicar.");
    return;
  }
  fetch(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      kind: "blogger#post",
      title: titulo,
      content: contenidoHTML,
      labels: etiquetas
    })
  })
  .then(res => res.json())
  .then(data => {
    alert(`Publicado con éxito: "${titulo}"`);
  })
  .catch(error => {
    console.error("Error al publicar:", error);
    alert("Error al publicar en Blogger.");
  });
}

// Eventos cerrar diálogo
closeDialog.addEventListener("click", () => {
  dialog.classList.add("hidden");
  blurOverlay.classList.remove("show");
  blurOverlay.classList.add("hidden");
});
blurOverlay.addEventListener("click", () => {
  dialog.classList.add("hidden");
  blurOverlay.classList.remove("show");
  blurOverlay.classList.add("hidden");
});

// Eventos botones y scroll (igual que antes)
discoverBtn.addEventListener("click", () => {
  currentPage = 1;
  currentMode = "discover";
  currentGenre = genreSelect.value;
  currentYear = yearSelect.value;

  let url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=es-ES&sort_by=popularity.desc&include_adult=false&page=${currentPage}`;
  if (currentGenre) url += `&with_genres=${currentGenre}`;
  if (currentYear) url += `&primary_release_year=${currentYear}`;
  fetchMovies(url);
});
searchBtn.addEventListener("click", () => {
  currentPage = 1;
  currentMode = "search";
  currentQuery = searchInput.value.trim();
  if (!currentQuery) return;

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(currentQuery)}&page=${currentPage}&include_adult=false`;
  fetchMovies(url);
});
window.addEventListener("scroll", () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200 && !isLoading && currentPage < totalPages) {
    currentPage++;
    let url;
    if (currentMode === "discover") {
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=es-ES&sort_by=popularity.desc&include_adult=false&page=${currentPage}`;
      if (currentGenre) url += `&with_genres=${currentGenre}`;
      if (currentYear) url += `&primary_release_year=${currentYear}`;
    } else if (currentMode === "search") {
      url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(currentQuery)}&page=${currentPage}&include_adult=false`;
    }
    if (url) fetchMovies(url, true);
  }
});

// Carga géneros al inicio
function fetchGenres() {
  const url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=es-ES`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.genres && Array.isArray(data.genres)) {
        data.genres.forEach(genre => {
          const option = document.createElement("option");
          option.value = genre.id;
          option.textContent = genre.name;
          genreSelect.appendChild(option);
        });
      }
    })
    .catch(err => {
      console.error("Error cargando géneros:", err);
    });
}

fetchGenres();
discoverBtn.click();

// Inicializar Google Sign-In (debes agregar el botón en HTML)
window.onload = () => {
  initializeGoogleSignIn();
};
