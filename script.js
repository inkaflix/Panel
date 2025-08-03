const TMDB_API_KEY = "dc340e81a2bdef1a7bcb0b31358487fd";
const imageBase = "https://image.tmdb.org/t/p/w500";

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const genreSelect = document.getElementById("genreFilter");
const yearSelect = document.getElementById("yearFilter");
const movieGrid = document.getElementById("movieGrid");
const loadingSpinner = document.getElementById("loadingSpinner");

const movieDialog = document.getElementById("movieDialog");
const dialogContent = document.getElementById("dialogContent");
const closeDialog = document.getElementById("closeDialog");
const blurOverlay = document.getElementById("blurOverlay");

const discoverBtn = document.getElementById("discoverButton");
const navButtons = document.querySelectorAll("nav button");

// Estado global
let currentPage = 1;
let totalPages = 1;
let currentMode = "discover"; // "discover" o "search"
let currentQuery = "";
let currentGenre = "";
let currentYear = "";
let isLoading = false;
let currentCategory = "tv"; // "tv" o "movie" según botón activo

// --- UTILIDADES ---

function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return "";
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function clearGrid() {
  movieGrid.innerHTML = "";
}

function showSpinner() {
  loadingSpinner.classList.remove("hidden");
}

function hideSpinner() {
  loadingSpinner.classList.add("hidden");
}

// --- CARGAR GÉNEROS ---

async function loadGenres() {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/genre/${currentCategory}/list?api_key=${TMDB_API_KEY}&language=es-ES`
    );
    const data = await res.json();
    genreSelect.innerHTML = '<option value="">Todos los géneros</option>';
    data.genres.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = g.name;
      genreSelect.appendChild(opt);
    });
  } catch {
    // fallback genérico
    genreSelect.innerHTML = `
      <option value="">Todos los géneros</option>
      <option value="10759">Acción y aventura</option>
      <option value="35">Comedia</option>
      <option value="18">Drama</option>`;
  }
}

// --- CARGAR AÑOS ---

function loadYears() {
  yearSelect.innerHTML = '<option value="">Todos los años</option>';
  const yearNow = new Date().getFullYear();
  for (let y = yearNow; y >= 1950; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

// --- FETCH SERIES O PELÍCULAS ---

async function fetchItems(page = 1, append = false) {
  if (isLoading) return;
  isLoading = true;
  showSpinner();

  let url;
  if (currentMode === "discover") {
    url = `https://api.themoviedb.org/3/discover/${currentCategory}?api_key=${TMDB_API_KEY}&language=es-ES&sort_by=popularity.desc&page=${page}`;
    if (currentGenre) url += `&with_genres=${currentGenre}`;
    if (currentYear) url += `&year=${currentYear}`;
  } else {
    if (!currentQuery) {
      hideSpinner();
      isLoading = false;
      return;
    }
    url = `https://api.themoviedb.org/3/search/${currentCategory}?api_key=${TMDB_API_KEY}&language=es-ES&query=${encodeURIComponent(
      currentQuery
    )}&page=${page}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!append) clearGrid();

    if (!data.results || data.results.length === 0) {
      if (!append)
        movieGrid.innerHTML =
          '<p style="color:#ccc; text-align:center; grid-column: 1/-1;">No se encontraron resultados.</p>';
      hideSpinner();
      isLoading = false;
      return;
    }

    totalPages = data.total_pages;
    renderCards(data.results, append);
  } catch (err) {
    console.error(err);
    if (!append)
      movieGrid.innerHTML =
        '<p style="color:#ccc; text-align:center; grid-column: 1/-1;">Error al cargar datos.</p>';
  } finally {
    hideSpinner();
    isLoading = false;
  }
}

function renderCards(items, append = false) {
  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "movie-card";
    const title = item.title || item.name || "Sin título";
    const date = formatDate(item.release_date || item.first_air_date);
    const poster = item.poster_path
      ? imageBase + item.poster_path
      : "https://via.placeholder.com/500x750?text=Sin+imagen";

    card.innerHTML = `
      <img src="${poster}" alt="${title}" loading="lazy" />
      <div class="title" title="${title}">${title}</div>
      <div class="release-date">${date}</div>
    `;

    card.addEventListener("click", () => {
      showDetails(item.id);
    });

    fragment.appendChild(card);
  });

  if (!append) clearGrid();
  movieGrid.appendChild(fragment);
}

// --- MOSTRAR DETALLES EN MODAL ---

async function showDetails(id) {
  try {
    const url = `https://api.themoviedb.org/3/${currentCategory}/${id}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=videos`;
    const res = await fetch(url);
    const data = await res.json();

    const title = data.title || data.name || "Sin título";
    const overview = data.overview || "Sin descripción";
    const date = data.release_date || data.first_air_date || "N/A";
    const genres = data.genres?.map((g) => g.name).join(", ") || "N/A";
    const vote = data.vote_average || "N/A";
    const runtime = data.runtime || data.episode_run_time?.[0] || "N/A";
    const seasons = data.number_of_seasons || "N/A";
    const episodes = data.number_of_episodes || "N/A";
    const trailer = data.videos?.results.find(
      (v) => v.site === "YouTube" && v.type === "Trailer"
    );
    const trailerUrl = trailer
      ? `https://www.youtube.com/watch?v=${trailer.key}`
      : null;

    dialogContent.innerHTML = `
      <h2 id="dialogTitle" style="color:#00bcd4;">${title}</h2>
      <p><strong>Géneros:</strong> ${genres}</p>
      <p><strong>Fecha de estreno:</strong> ${formatDate(date)}</p>
      <p><strong>Duración:</strong> ${runtime} minutos</p>
      <p><strong>Seasons:</strong> ${seasons}</p>
      <p><strong>Episodes:</strong> ${episodes}</p>
      <p><strong>Rating:</strong> ${vote}</p>
      <p style="margin-top: 1rem;">${overview}</p>
      ${
        trailerUrl
          ? `<p><a href="${trailerUrl}" target="_blank" rel="noopener noreferrer" style="color:#00bcd4;">Ver trailer ▶️</a></p>`
          : ""
      }
    `;

    blurOverlay.classList.remove("hidden");
    movieDialog.classList.remove("hidden");
    movieDialog.focus();
  } catch (err) {
    alert("Error cargando detalles");
    console.error(err);
  }
}

function closeModal() {
  blurOverlay.classList.add("hidden");
  movieDialog.classList.add("hidden");
}

// --- SCROLL INFINITO ---

window.addEventListener("scroll", () => {
  if (
    window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 300 &&
    !isLoading &&
    currentPage < totalPages
  ) {
    currentPage++;
    fetchItems(currentPage, true);
  }
});

// --- EVENTOS ---

searchButton.addEventListener("click", () => {
  currentMode = "search";
  currentQuery = searchInput.value.trim();
  if (!currentQuery) {
    movieGrid.innerHTML =
      '<p style="color:#ccc; text-align:center;">Escribe algo para buscar.</p>';
    return;
  }
  currentPage = 1;
  fetchItems(currentPage);
});

searchInput.addEventListener(
  "input",
  debounce(() => {
    const val = searchInput.value.trim();
    if (val.length < 3) return;
    currentMode = "search";
    currentQuery = val;
    currentPage = 1;
    fetchItems(currentPage);
  }, 500)
);

genreSelect.addEventListener("change", () => {
  currentGenre = genreSelect.value;
  if (currentMode === "discover") {
    currentPage = 1;
    fetchItems(currentPage);
  }
});

yearSelect.addEventListener("change", () => {
  currentYear = yearSelect.value;
  if (currentMode === "discover") {
    currentPage = 1;
    fetchItems(currentPage);
  }
});

discoverBtn.addEventListener("click", () => {
  currentMode = "discover";
  currentGenre = genreSelect.value;
  currentYear = yearSelect.value;
  currentQuery = "";
  currentPage = 1;
  fetchItems(currentPage);
});

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");

    // Cambiar categoría (tv o movie)
    if (btn.id === "discoverButton") currentCategory = "tv";
    else if (btn.id === "seriesButton") currentCategory = "movie";
    else currentCategory = "tv";

    // Reset filtros y búsqueda
    searchInput.value = "";
    currentQuery = "";
    genreSelect.value = "";
    yearSelect.value = "";
    currentGenre = "";
    currentYear = "";
    currentPage = 1;
    currentMode = "discover";
    fetchItems(currentPage);
    loadGenres();
  });
});

closeDialog.addEventListener("click", closeModal);
blurOverlay.addEventListener("click", closeModal);

// --- INICIALIZACIÓN ---

loadYears();
loadGenres();
fetchItems(currentPage);
