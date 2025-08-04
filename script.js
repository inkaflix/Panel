const apiKey = "dc340e81a2bdef1a7bcb0b31358487fd";
const imageBase = "https://image.tmdb.org/t/p/w500";
const backdropBase = "https://image.tmdb.org/t/p/w1280";

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

let currentPage = 1;
let totalPages = 1;
let currentMode = "discover";
let currentQuery = "";
let currentGenre = "";
let currentYear = "";
let isLoading = false;

// Llena los años para el filtro de año
for (let y = 2025; y >= 1950; y--) {
  const opt = document.createElement("option");
  opt.value = y;
  opt.textContent = y;
  yearSelect.appendChild(opt);
}

function showSpinner() {
  spinner.style.display = "block";
}
function hideSpinner() {
  spinner.style.display = "none";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = new Date(dateStr);
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

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
    if (!append) movieGrid.innerHTML = "<p style='color:white'>No se encontraron películas.</p>";
    return;
  }
  movies.forEach(movie => {
    const card = document.createElement("div");
    card.className = "movie-card";
    const formattedDate = formatDate(movie.release_date);
    card.innerHTML = `
      <img src="${movie.poster_path ? imageBase + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" alt="${movie.title}" />
      <div class="title">${movie.title}</div>
      <div class="release-date">${formattedDate}</div>
    `;
    card.addEventListener("click", () => showMovieDetails(movie.id));
    movieGrid.appendChild(card);
  });
}

function showMovieDetails(movieId) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=es-ES&append_to_response=videos`;
  fetch(url)
    .then(res => res.json())
    .then(movie => {
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

<div class=\"plyer-node\" data-selected-lang=\"lat\"></div>
<script>
  const _SV_LINKS = [
    {
      lang: \"lat\",
      name: \"Servers\",
      quality: \"HD\",
      url: \"https://streaming.cinedom.pro/api/movie/${movie.id}\",
      tagVideo: false
    }
  ]
</script>
`;

      // Copiar al portapapeles el bloque HTML completo
      navigator.clipboard.writeText(htmlOutput).then(() => {
        console.log("Bloque HTML copiado al portapapeles");
      });

      // Mostrar diálogo con el contenido
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

// Eventos para cerrar diálogo
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

// Evento descubrir películas con filtros
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

// Evento buscar películas por texto
searchBtn.addEventListener("click", () => {
  currentPage = 1;
  currentMode = "search";
  currentQuery = searchInput.value.trim();
  if (!currentQuery) return;

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(currentQuery)}&page=${currentPage}&include_adult=false`;
  fetchMovies(url);
});

// Scroll infinito para cargar más resultados
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

// Cargar géneros para filtro
function fetchGenres() {
  fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}&language=es-ES`)
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
    .catch(err => console.error("Error cargando géneros:", err));
}

// Inicialización
fetchGenres();
discoverBtn.click();
