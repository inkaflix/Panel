const apiKey = "dc340e81a2bdef1a7bcb0b31358487fd";
const imageBase = "https://image.tmdb.org/t/p/w500";
const backdropBase = "https://image.tmdb.org/t/p/w1280";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchButton");
const htmlOutput = document.getElementById("htmlOutput");
const postTitle = document.getElementById("postTitle");
const customIdInput = document.getElementById("customIdInput");

searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (!query) {
    alert("Por favor ingresa un ID o título de película.");
    return;
  }

  // Detectar si es número (ID) o texto (búsqueda por título)
  if (/^\d+$/.test(query)) {
    fetchMovieById(query);
  } else {
    fetchMovieByTitle(query);
  }
});

function fetchMovieById(id) {
  fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=es-ES`)
    .then(res => res.json())
    .then(movie => generateHtml(movie))
    .catch(() => alert("No se encontró la película con ese ID."));
}

function fetchMovieByTitle(title) {
  fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(title)}`)
    .then(res => res.json())
    .then(data => {
      if (data.results.length === 0) {
        alert("No se encontraron películas con ese título.");
        return;
      }
      const movie = data.results[0];
      fetchMovieById(movie.id);
    })
    .catch(() => alert("Error buscando la película."));
}

function generateHtml(movie) {
  const year = movie.release_date ? movie.release_date.split("-")[0] : "N/A";
  const genres = movie.genres ? movie.genres.map(g => g.name).join(", ") : "N/A";
  const customId = customIdInput.value.trim();

  if (!customId) {
    alert("Por favor ingresa un Custom ID para la URL de streaming.");
    return;
  }

  const html = `
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

  htmlOutput.value = html;
  postTitle.value = movie.title;
}
