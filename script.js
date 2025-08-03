const CLIENT_ID = '155693540835-c5528m80r913cahna97nmg7t834pgaub.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBvtH_J_Xs6TnD4VpQxdlgcOjXrYZtVyLk';
const BLOG_ID = '3812927193244872888';
const SCOPES = 'https://www.googleapis.com/auth/blogger';

const TMDB_API_KEY = 'dc340e81a2bdef1a7bcb0b31358487fd';
const imageBase = "https://image.tmdb.org/t/p/w500";
const backdropBase = "https://image.tmdb.org/t/p/w1280";

let tokenClient;
let gapiInited = false;

const authBtn = document.getElementById('authBtn');
const formSection = document.getElementById('formSection');
const tmdbSearch = document.getElementById('tmdbSearch');
const searchResults = document.getElementById('searchResults');
const genreSelect = document.getElementById('genreFilter');
const yearSelect = document.getElementById('yearFilter');
const discoverBtn = document.getElementById('discoverButton');
const searchBtn = document.getElementById('searchButton');
const movieGrid = document.getElementById('movieGrid');
const spinner = document.getElementById('loadingSpinner');
const postTitle = document.getElementById('postTitle');
const postContent = document.getElementById('postContent');
const postLabels = document.getElementById('postLabels');
const publishButton = document.getElementById('publishButton');
const status = document.getElementById('status');
const movieDialog = document.getElementById('movieDialog');
const dialogContent = document.getElementById('dialogContent');
const closeDialog = document.getElementById('closeDialog');
const blurOverlay = document.getElementById('blurOverlay');

let currentPage = 1;
let totalPages = 1;
let currentMode = "discover";
let currentQuery = "";
let currentGenre = "";
let currentYear = "";
let isLoading = false;

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({ apiKey: API_KEY });
  gapiInited = true;
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      gapi.client.setToken(tokenResponse);
      formSection.classList.remove('hidden');
      authBtn.style.display = 'none';
    },
  });
}

function handleAuth() {
  tokenClient.requestAccessToken();
}

async function publishPost() {
  const title = postTitle.value.trim();
  const content = postContent.value.trim();
  const labels = postLabels.value.split(',').map(e => e.trim()).filter(e => e);

  if (!title || !content) {
    status.innerText = "❌ Título y contenido son obligatorios.";
    return;
  }

  const post = {
    kind: "blogger#post",
    blog: { id: BLOG_ID },
    title: title,
    content: content,
    labels: labels
  };

  try {
    status.innerText = "⏳ Publicando...";
    const response = await gapi.client.request({
      path: `https://www.googleapis.com/blogger/v3/blogs/${BLOG_ID}/posts/`,
      method: 'POST',
      body: post
    });
    status.innerHTML = `✅ Publicado: <a href="${response.result.url}" target="_blank">${response.result.url}</a>`;
  } catch (err) {
    status.innerText = `❌ Error: ${err.message}`;
  }
}

function showSpinner() { spinner.style.display = "block"; }
function hideSpinner() { spinner.style.display = "none"; }

function formatDate(dateStr) {
  if (!dateStr) return "";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const date = new Date(dateStr);
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

function loadGenres() {
  fetch(`https://api.themoviedb.org/3/genre/tv/list?api_key=${TMDB_API_KEY}&language=es-ES`)
    .then(res => res.json())
    .then(data => {
      data.genres.forEach(genre => {
        const option = document.createElement("option");
        option.value = genre.id;
        option.textContent = genre.name;
        genreSelect.appendChild(option);
      });
    });
}

function loadYears() {
  for (let y = 2025; y >= 1950; y--) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    yearSelect.appendChild(option);
  }
}

function fetchSeries(url, append = false) {
  isLoading = true;
  showSpinner();
  fetch(url)
    .then(res => res.json())
    .then(data => {
      displaySeries(data.results, append);
      totalPages = data.total_pages;
      isLoading = false;
      hideSpinner();
    });
}

function displaySeries(seriesList, append = false) {
  if (!append) movieGrid.innerHTML = "";
  if (!seriesList || seriesList.length === 0) {
    if (!append) movieGrid.innerHTML = "<p style='color:#ccc'>No se encontraron series.</p>";
    return;
  }
  seriesList.forEach(serie => {
    const card = document.createElement("div");
    card.className = "movie-card";
    const formattedDate = formatDate(serie.first_air_date);
    card.innerHTML = `
      <img src="${serie.poster_path ? imageBase + serie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image'}" alt="${serie.name}" />
      <div class="title">${serie.name}</div>
      <div class="release-date">${formattedDate}</div>
    `;
    card.addEventListener("click", () => showSeriesDetails(serie.id));
    movieGrid.appendChild(card);
  });
}

function showSeriesDetails(seriesId) {
  const url = `https://api.themoviedb.org/3/tv/${seriesId}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=videos`;
  fetch(url)
    .then(res => res.json())
    .then(series => {
      const year = series.first_air_date ? series.first_air_date.split("-")[0] : "";
      const genres = series.genres?.map(g => g.name) || [];
      const trailer = series.videos?.results.find(v => v.site === "YouTube" && v.type === "Trailer");
      const trailerId = trailer ? trailer.key : "";
      const duration = series.episode_run_time?.[0] || 'N/A';

      const htmlOutput = `
<!-- Configuration episode list -->
<!-- Name: ${series.name} -->
<!-- Genres: ${genres.join(",")},${year},Series,2024 -->
<div data-post-type="serie" hidden>
  <img src="${imageBase + series.poster_path}" alt="${series.name}"/>
  <p id="tmdb-synopsis">${series.overview}</p>
</div>
<a name='more'></a>
<div data-youtube-id="${trailerId}" data-backdrop="${backdropBase + series.backdrop_path}" data-imdb="${series.vote_average}" data-year="${year}" data-duration="${duration} min"></div>
<div class="headline is-small mb-4"><h2 class="headline__title">Information</h2></div>
<ul class="post-details mb-4">
  <li><span>Title</span>${series.name}</li>
  <li><span>Original titles</span>${series.original_name}</li>
  <li><span>Duration</span>${duration} min</li>
  <li><span>Year</span>${year}</li>
  <li><span>Episodes</span>${series.number_of_episodes}</li>
  <li><span>Seasons</span>${series.number_of_seasons}</li>
  <li><span>Release date</span>${series.first_air_date}</li>
  <li><span>Genres</span>${genres.join(", ")}</li>
</ul>`;

      postTitle.value = series.name;
      postContent.value = htmlOutput;
      postLabels.value = genres.join(", ");
      dialogContent.textContent = htmlOutput;
      movieDialog.style.display = "block";
      blurOverlay.style.display = "block";
    });
}

window.addEventListener("scroll", () => {
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200 && !isLoading && currentPage < totalPages) {
    currentPage++;
    let url;
    if (currentMode === "discover") {
      url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=es-ES&sort_by=popularity.desc&page=${currentPage}`;
      if (currentGenre) url += `&with_genres=${currentGenre}`;
      if (currentYear) url += `&first_air_date_year=${currentYear}`;
    } else if (currentMode === "search") {
      url = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(currentQuery)}&page=${currentPage}`;
    }
    if (url) fetchSeries(url, true);
  }
});

discoverBtn.addEventListener("click", () => {
  currentPage = 1;
  currentMode = "discover";
  currentGenre = genreSelect.value;
  currentYear = yearSelect.value;
  currentQuery = "";
  let url = `https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_API_KEY}&language=es-ES&sort_by=popularity.desc&page=1`;
  if (currentGenre) url += `&with_genres=${currentGenre}`;
  if (currentYear) url += `&first_air_date_year=${currentYear}`;
  fetchSeries(url);
});

searchBtn.addEventListener("click", () => {
  currentPage = 1;
  currentMode = "search";
  currentQuery = tmdbSearch.value.trim();
  if (!currentQuery) {
    movieGrid.innerHTML = "<p style='color:#ccc'>Escribe un término para buscar.</p>";
    return;
  }
  fetchSeries(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(currentQuery)}&page=1`);
});

tmdbSearch.addEventListener("input", () => {
  const query = tmdbSearch.value.trim();
  if (query.length < 3) {
    searchResults.classList.add("hidden");
    searchResults.innerHTML = "";
    return;
  }
  fetch(`https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(query)}&page=1`)
    .then(res => res.json())
    .then(data => {
      searchResults.innerHTML = "";
      if (!data.results || data.results.length === 0) {
        searchResults.classList.add("hidden");
        return;
      }
      data.results.slice(0, 7).forEach(serie => {
        const li = document.createElement("li");
        li.textContent = serie.name;
        li.title = serie.name;
        li.addEventListener("click", () => {
          searchResults.classList.add("hidden");
          tmdbSearch.value = serie.name;
          showSeriesDetails(serie.id);
        });
        searchResults.appendChild(li);
      });
      searchResults.classList.remove("hidden");
    });
});

document.addEventListener("click", (e) => {
  if (!tmdbSearch.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.classList.add("hidden");
  }
});

publishButton.addEventListener("click", publishPost);

closeDialog.addEventListener("click", () => {
  movieDialog.style.display = "none";
  blurOverlay.style.display = "none";
});
blurOverlay.addEventListener("click", () => {
  movieDialog.style.display = "none";
  blurOverlay.style.display = "none";
});

authBtn.addEventListener("click", handleAuth);
loadGenres();
loadYears();

window.onload = () => {
  if (window.gapi) gapiLoaded();
  if (window.google) gisLoaded();
};
