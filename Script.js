// =======================================================
// Script.js - Lógica principal de la Pokedex
// Autor: Sebastian Salgado
// Última actualización: 2025-08-21
// =======================================================

// =============================
// VARIABLES GLOBALES
// =============================
let currentPokemonId = 1;
let lastData = null;

// =============================
// 1. CAMBIO DE TEMA
// =============================

/**
 * Cambia el tema de la aplicación y guarda la preferencia en localStorage.
 * @param {string} theme - 'light' o 'dark'
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const btn = document.getElementById('btnTheme');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa el tema guardado
  const saved = localStorage.getItem('theme') || 'light';
  setTheme(saved);

  // Evento click para botón de tema
  const btn = document.getElementById('btnTheme');
  if (btn) {
    btn.onclick = () => {
      const current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    };
  }

  // Renderiza favoritos al inicio
  renderFavoritos();

  // Botón limpiar búsqueda
  const btnLimpiar = document.getElementById('btnLimpiar');
  if (btnLimpiar) {
    btnLimpiar.onclick = limpiarBusqueda;
  }

  // Oculta todas las secciones excepto la búsqueda al iniciar
  ocultarSecciones();
});

// =============================
// 2. FUNCIONES DE SHOW/HIDE SECCIONES
// =============================

/**
 * Oculta todas las secciones principales y limpia su contenido.
 */
function ocultarSecciones() {
  const ids = [
    'pokemonSection',
    'favoritos',
    'cartasTCGBox',
    'evoluciones',
    'encuentros',
    'movimientos',
    'pokemonAudio'
  ];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Limpia el contenido de los contenedores
  [
    'pokemonContainer',
    'pokemonAudio',
    'evoluciones',
    'encuentros',
    'movimientos',
    'favoritosLista',
    'cartasTCGCarouselInner'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
}

/**
 * Muestra las secciones principales tras una búsqueda exitosa.
 */
function mostrarSecciones() {
  [
    'pokemonSection',
    'favoritos',
    'pokemonAudio',
    'evoluciones',
    'encuentros',
    'movimientos'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  });
}

/**
 * Limpia el campo de búsqueda y oculta las secciones.
 */
function limpiarBusqueda() {
  document.getElementById('pokemonInput').value = '';
  ocultarSecciones();
}

// =============================
// 3. GESTIÓN DE FAVORITOS
// =============================

/**
 * Obtiene la lista de favoritos desde localStorage.
 * @returns {Array}
 */
function getFavoritos() {
  return JSON.parse(localStorage.getItem('favoritosPokemon') || '[]');
}

/**
 * Guarda la lista de favoritos en localStorage.
 * @param {Array} favoritos
 */
function setFavoritos(favoritos) {
  localStorage.setItem('favoritosPokemon', JSON.stringify(favoritos));
}

/**
 * Agrega o elimina un Pokémon de favoritos.
 * @param {number} id
 * @param {string} name
 * @param {string} img
 */
function toggleFavorito(id, name, img) {
  let favs = getFavoritos();
  if (favs.some(f => f.id === id)) {
    favs = favs.filter(f => f.id !== id);
  } else {
    favs.push({ id, name, img });
  }
  setFavoritos(favs);
  renderFavoritos();
  buscarPokemonPorId(id);
}

/**
 * Renderiza la sección de favoritos.
 */
function renderFavoritos() {
  const favs = getFavoritos();
  const sec = document.getElementById('favoritos');
  const list = document.getElementById('favoritosLista');
  if (!sec || !list) return;

  if (!favs.length) {
    sec.classList.add('d-none');
    list.innerHTML = '';
    return;
  }
  sec.classList.remove('d-none');
  list.innerHTML = favs.map(f => `
    <div class="card text-center" style="width:90px;border:1.5px solid #e3350d;">
      <img src="${f.img}" class="card-img-top mt-2" style="width:56px;margin:auto;" alt="${f.name}">
      <div class="card-body p-2">
        <small style="font-size:0.7rem;cursor:pointer;color:#e3350d;"
               onclick="buscarPokemonPorId(${f.id})">
          ${f.name.charAt(0).toUpperCase() + f.name.slice(1)}
        </small><br>
        <button class="btn btn-sm mt-1" style="background:#ffd600;color:#e3350d;"
                onclick="toggleFavorito(${f.id}, '${f.name}', '${f.img}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// =============================
// 4. BÚSQUEDA Y ERRORES
// =============================

/**
 * Busca un Pokémon por su ID y muestra sus datos.
 * @param {number} id
 */
async function buscarPokemonPorId(id) {
  showSpinner();
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    currentPokemonId = data.id;
    await mostrarPokemon(data);
  } catch {
    mostrarError('Pokémon no encontrado.');
  } finally {
    hideSpinner();
  }
}

/**
 * Busca un Pokémon por nombre o ID desde el input.
 */
async function buscarPokemon() {
  const name = document.getElementById('pokemonInput').value.toLowerCase().trim();
  if (!name) return;
  showSpinner();
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    currentPokemonId = data.id;
    await mostrarPokemon(data);
  } catch {
    mostrarError('Pokémon no encontrado.');
  } finally {
    hideSpinner();
  }
}

/**
 * Muestra un mensaje de error en la interfaz.
 * @param {string} msg
 */
function mostrarError(msg) {
  const c = document.getElementById('pokemonContainer');
  c.innerHTML = `<p class="text-center text-danger">${msg}</p>`;
  ['evoluciones','encuentros','movimientos'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  const tcg = document.getElementById('cartasTCGBox');
  if (tcg) tcg.style.display = 'none';
}

// =============================
// 5. MOSTRAR POKÉMON
// =============================

/**
 * Renderiza la información completa de un Pokémon.
 * @param {Object} data
 */
async function mostrarPokemon(data) {
  lastData = data;
  const c = document.getElementById('pokemonContainer');
  const img = data.sprites.front_default || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png';
  const audio = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${data.id}.ogg`;

  // Audio
  document.getElementById('pokemonAudio').innerHTML = `
    <button class="btn btn-outline-secondary btn-sm mb-2" onclick="document.getElementById('audioPoke').play()">
      <i class="fa-solid fa-volume-high"></i> Grito
    </button>
    <audio id="audioPoke" src="${audio}"></audio>
  `;

  // Evoluciones
  let evoHtml = '';
  try {
    const s = await fetch(data.species.url).then(r => r.json());
    const e = await fetch(s.evolution_chain.url).then(r => r.json());
    evoHtml = renderEvoluciones(e.chain);
  } catch {
    evoHtml = '<div>No disponible</div>';
  }
  document.getElementById('evoluciones').innerHTML = evoHtml;

  // Encuentros
  let encHtml = '';
  try {
    const list = await fetch(data.location_area_encounters).then(r => r.json());
    encHtml = list.length
      ? list.slice(0, 8).map(e => `<span class="badge bg-info text-dark m-1">${e.location_area.name.replace(/-/g,' ')}</span>`).join('')
      : '<div>No hay encuentros</div>';
  } catch {
    encHtml = '<div>No disponible</div>';
  }
  document.getElementById('encuentros').innerHTML = encHtml;

  // Movimientos
  document.getElementById('movimientos').innerHTML = data.moves.slice(0, 8)
    .map(m => `<span class="badge bg-success m-1">${m.move.name.replace(/-/g,' ')}</span>`).join('');

  // Favorito y medalla
  const isFav = getFavoritos().some(f => f.id === data.id);
  const favCls = isFav ? 'fa-solid' : 'fa-regular';
  const sData = await fetch(data.species.url).then(r => r.json());
  const badge = sData.is_legendary
    ? `<span class="badge bg-warning text-dark ms-2"><i class="fa-solid fa-crown"></i></span>`
    : '';

  // Stats con barras
  const statClassMap = {
    hp: 'hp', attack: 'attack', defense: 'defense',
    'special-attack': 'special-attack',
    'special-defense': 'special-defense', speed: 'speed'
  };
  const mapNames = {
    hp: '❤️ HP', attack: '⚔️ Ataque', defense: '🛡️ Defensa',
    'special-attack': '✨ Sp. Atk', 'special-defense': '🔮 Sp. Def',
    speed: '⚡ Velocidad'
  };
  const statsHtml = data.stats.map(stat => {
    const name = stat.stat.name;
    const val = stat.base_stat;
    const pct = Math.min(val / 200 * 100, 100);
    return `
      <div class="mb-3">
        <div class="d-flex justify-content-between mb-1">
          <span>${mapNames[name] || name}</span>
          <span>${val}</span>
        </div>
        <div class="stat-bar-container">
          <div class="stat-bar ${statClassMap[name]||''}" style="width:${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');

  // Construir card principal
  c.style.opacity = 0;
  c.innerHTML = `
    <div class="card mb-3" style="border:2px solid #ffd600;">
      <div class="card-body text-center">
        <h2 style="color:#3b4cca;">${data.name.toUpperCase()} ${badge}</h2>
        <img src="${img}" alt="${data.name}">
        <p><strong>Tipo:</strong> ${data.types.map(t => t.type.name).join(', ')}</p>
        <p><strong>Altura:</strong> ${data.height/10} m</p>
        <p><strong>Peso:</strong> ${data.weight/10} kg</p>
        <button class="btn btn-poke-yellow mb-3" onclick="toggleFavorito(${data.id},'${data.name}','${img}')">
          <i class="${favCls} fa-heart"></i> Favorito
        </button>
        <h3>Estadísticas</h3>
        ${statsHtml}
      </div>
    </div>
  `;
  c.style.display = 'block';
  setTimeout(() => { c.style.transition = 'opacity 0.5s'; c.style.opacity = 1; }, 50);

  // Mostrar todas las secciones
  mostrarSecciones();

  // Mostrar carrusel TCG
  mostrarCartasTCG(data.name);

  // Fondo dinámico según tipo
  const colors = {
    normal:'#A8A77A', fire:'#EE8130', water:'#6390F0', electric:'#F7D02C',
    grass:'#7AC74C', ice:'#96D9D6', fighting:'#C22E28', poison:'#A33EA1',
    ground:'#E2BF65', flying:'#A98FF3', psychic:'#F95587', bug:'#A6B91A',
    rock:'#B6A136', ghost:'#735797', dragon:'#6F35FC', dark:'#705746',
    steel:'#B7B7CE', fairy:'#D685AD'
  };
  const bg = colors[data.types[0].type.name] || '#fff';
  c.style.background = `linear-gradient(135deg, ${bg} 65%, #fff 100%)`;
  c.style.boxShadow = `0 0 20px 6px ${bg}70`;

  // Muestra la sección de info adicional
  document.getElementById('infoAdicional').style.display = 'flex';
}

// =============================
// 6. CARRUSEL DE CARTAS TCG
// =============================

const TCG_API_KEY = 'c79609ca-736c-4822-87c1-b13e29c8d560';

/**
 * Muestra el carrusel de cartas TCG del Pokémon buscado.
 * @param {string} name
 */
async function mostrarCartasTCG(name) {
  const box = document.getElementById('cartasTCGBox');
  const inner = document.getElementById('cartasTCGCarouselInner');
  if (!box || !inner) return;
  inner.innerHTML = '';
  box.style.display = 'none';

  const cap = name.charAt(0).toUpperCase() + name.slice(1);
  const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(cap)}`, {
    headers: { 'X-Api-Key': TCG_API_KEY }
  });
  const data = await res.json();

  if (!data.data || !data.data.length) {
    inner.innerHTML = '<div class="carousel-item active text-center p-5">No se encontraron cartas TCG</div>';
  } else {
    inner.innerHTML = data.data.slice(0,10).map((card,i) => `
      <div class="carousel-item${i===0?' active':''}">
        <div class="card text-center p-2" style="min-height:300px;border:2px solid #ffd600;background:#fffbe7;">
          <img src="${card.images.large||card.images.small}" style="max-width:180px;margin:auto;" alt="${card.name}">
          <div class="mt-2"><strong>${card.name}</strong><div style="font-size:0.9rem;color:#555;">${card.set.name}</div></div>
        </div>
      </div>
    `).join('');
  }
  box.style.display = 'block';
  const carouselEl = document.getElementById('cartasTCGCarousel');
  if (carouselEl) bootstrap.Carousel.getOrCreateInstance(carouselEl);
}

// =============================
// 7. RENDER ESTRUCTURA EVOLUCIONES
// =============================

/**
 * Renderiza la cadena de evoluciones de un Pokémon.
 * @param {Object} chain
 * @returns {string} HTML
 */
function renderEvoluciones(chain) {
  let html = '<div class="d-flex align-items-center justify-content-center gap-2 flex-wrap">';
  let cur = chain;
  while (cur) {
    const name = cur.species.name;
    const id = cur.species.url.split('/').filter(Boolean).pop();
    html += `
      <div class="text-center">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" width="48">
        <div style="font-size:0.95rem;font-weight:700;color:#3b4cca;">
          ${name.charAt(0).toUpperCase()+name.slice(1)}
        </div>
      </div>
    `;
    cur = cur.evolves_to.length ? cur.evolves_to[0] : null;
    if (cur) html += '<span style="font-size:2rem;color:#3b4cca;">→</span>';
  }
  return html + '</div>';
}

// =============================
// 8. NAVEGACIÓN Y UTILITARIOS
// =============================

/**
 * Cambia al Pokémon anterior o siguiente.
 * @param {number} delta
 */
async function cambiarPokemon(delta) {
  const nid = currentPokemonId + delta;
  if (nid<1||nid>1025) return;
  await buscarPokemonPorId(nid);
}

/**
 * Busca un Pokémon aleatorio.
 */
function pokemonAleatorio() {
  buscarPokemonPorId(Math.floor(Math.random()*1025)+1);
}

/**
 * Muestra el spinner de carga si existe en el HTML.
 */
function showSpinner() {
  ['loadingSpinner','skeletonLoader'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display='block';
  });
  const c=document.getElementById('pokemonContainer');
  if(c) c.style.display='none';
}

/**
 * Oculta el spinner de carga si existe en el HTML.
 */
function hideSpinner() {
  ['loadingSpinner','skeletonLoader'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display='none';
  });
  const c=document.getElementById('pokemonContainer');
  if(c) c.style.display='block';
}

