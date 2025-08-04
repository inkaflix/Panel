const apiKey = "867b27ebb5a72c3f64ee67bc9dd7a794";
const imageBase = "https://image.tmdb.org/t/p/w500";
const backdropBase = "https://image.tmdb.org/t/p/w1280";

const movieGrid = document.getElementById("movieGrid");
const searchBtn = document.getElementById("searchButton");
const searchInput = document.getElementById("searchInput");

let serieCustomId = "";
let serieCustomUrl = "";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES");
}

function fetchSeries(url) {
  movieGrid.innerHTML = "<p>Cargando...</p>";
  fetch(url)
    .then(res => res.json())
    .then(data => {
      displaySeries(data.results);
    });
}

function displaySeries(series) {
  movieGrid.innerHTML = "";
  if (!series || series.length === 0) {
    movieGrid.innerHTML = "<p>No se encontraron series.</p>";
    return;
  }

  series.forEach(serie => {
    const card = document.createElement("div");
    card.className = "movie-card";
    const poster = serie.poster_path ? imageBase + serie.poster_path : "https://via.placeholder.com/300x450?text=Sin+Imagen";
    card.innerHTML = `
      <img src="${poster}" alt="${serie.name}" />
      <div class="title">${serie.name}</div>
      <div class="release-date">${formatDate(serie.first_air_date)}</div>
    `;
    card.addEventListener("click", () => showSeriesDetails(serie.id, serie.name));
    movieGrid.appendChild(card);
  });
}

function showSeriesDetails(tvId, serieName) {
  const url = `https://api.themoviedb.org/3/tv/${tvId}?api_key=${apiKey}&language=es-ES`;
  fetch(url)
    .then(res => res.json())
    .then(series => {
      movieGrid.innerHTML = `
        <div class="data-box">
          <h3>${serieName}</h3>
          <label>ID Blogger:</label><br>
          <input type="text" id="customIdInput" placeholder="Ej: 6395779005522593699"><br>
          <label>URL Serie:</label><br>
          <input type="text" id="customUrlInput" placeholder="Ej: https://miweb.com/serie"><br>
          <button onclick="saveCustomData()">Guardar Datos</button>
        </div>
      `;

      series.seasons.forEach(season => {
        const btn = document.createElement("div");
        btn.className = "season-option";
        btn.textContent = `${season.name} (${season.episode_count} episodios)`;
        btn.onclick = () => showEpisodes(tvId, season.season_number, serieName);
        movieGrid.appendChild(btn);
      });
    });
}

function saveCustomData() {
  serieCustomId = document.getElementById("customIdInput").value.trim();
  serieCustomUrl = document.getElementById("customUrlInput").value.trim();
  alert("✅ Datos guardados");
}

function showEpisodes(tvId, seasonNumber, serieName) {
  const url = `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}?api_key=${apiKey}&language=es-ES`;
  fetch(url)
    .then(res => res.json())
    .then(season => {
      if (!season.episodes || season.episodes.length === 0) {
        movieGrid.innerHTML = `<p>⚠️ Temporada "${season.name}" sin episodios aún.</p>`;
        return;
      }
      movieGrid.innerHTML = `<h3>${serieName} - ${season.name}</h3>`;
      season.episodes.forEach(ep => {
        const epBtn = document.createElement("div");
        epBtn.className = "episode-option";
        epBtn.textContent = `${ep.episode_number}. ${ep.name}`;
        epBtn.onclick = () => generateEpisodeCode(tvId, seasonNumber, ep.episode_number, serieName, ep);
        movieGrid.appendChild(epBtn);
      });
    });
}

function generateEpisodeCode(tvId, seasonNumber, episodeNumber, serieName, episode) {
  if (serieCustomId === "" || serieCustomUrl === "") {
    alert("❌ Guarda un ID y URL antes de generar.");
    return;
  }

  const selectedLang = document.getElementById("selectLang")?.value || "lat";
  const still = episode.still_path ? imageBase + episode.still_path : "https://via.placeholder.com/1280x720?text=Sin+Imagen";

  const htmlOutput = `
<!-- Episodio: ${episode.name} - T${seasonNumber}E${episodeNumber} -->
<!-- id-${serieCustomId},Episode -->
<div class='post-body'>
  <div data-post-type="episode" hidden>
    <img src="${still}" />
    <p id="tmdb-synopsis">${episode.overview || "Sin descripción"}</p>
  </div>
  <a name='more'></a>

  <div 
    data-player-backdrop="${backdropBase + (episode.still_path || "")}" 
    data-episode-count="${episode.episode_number}"
    data-season-number="${seasonNumber}"
    data-serie-name="${serieName}"
    data-serie-url="${serieCustomUrl}">
  </div>

  <header class="post-header">
    <span class="post-header__title">${episode.name}</span>
    <div class="post-header__meta">
      <span class="ssn">${seasonNumber}</span>
      <span class="num">${episode.episode_number}</span>
    </div>
  </header>

  <div class="plyer-node" data-selected-lang="${selectedLang}"></div>
  <script>
    const _SV_LINKS = [
      {
        lang: "${selectedLang}",
        name: "Vip🟢",
        quality: "HD",
        url: "https://streaming.cinedom.pro/api/tv/${tvId}/${seasonNumber}/${episodeNumber}",
        tagVideo: false
      }
    ]
  </script>
</div>
`;

  document.getElementById("htmlOutput").value = htmlOutput;
  document.getElementById("postTitle").value = `${serieName} T${seasonNumber}E${episodeNumber}`;
}

searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (!query) return;
  const url = `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&language=es-ES&query=${encodeURIComponent(query)}`;
  fetchSeries(url);
});
