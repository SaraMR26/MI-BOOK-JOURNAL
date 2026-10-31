// ============ UTILIDADES ============
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const ANIO_ACTUAL = new Date().getFullYear();
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };

let libros = load('libros', []), citas = load('citas', []), adaptaciones = load('adaptaciones', []);
let habitTrackerData = load('habitTrackerData', {}), favManual = load('favoritosManual', {});
let metas = load('metas', [
  { id: 1, titulo: 'Leer 20 libros en el año', objetivo: 20, actual: 0, completada: false },
  { id: 2, titulo: 'Leer al menos 5,000 páginas', objetivo: 5000, actual: 0, completada: false },
  { id: 3, titulo: 'Explorar un nuevo género literario', objetivo: 1, actual: 0, completada: false }
]);
let anioSeleccionado = ANIO_ACTUAL, vistaActual = 'inicio', modoTropes = 'mas';
let filtros = { q: '', est: '', trope: '' };
const pag = { citas: 1, registro: 1, proximos: 1, autores: 1, adaptaciones: 1 };
const POR_PAG = { citas: 10, registro: 15, proximos: 12, autores: 18, adaptaciones: 3 };

function guardarEnLocalStorage() {
  [['libros', libros], ['citas', citas], ['adaptaciones', adaptaciones], ['habitTrackerData', habitTrackerData], ['metas', metas], ['favoritosManual', favManual]]
    .forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
}
let _seq = 0;
const nuevoId = () => Date.now() * 100 + (_seq++ % 100);
const siguienteNumero = () => Math.max(0, ...libros.map(l => +l.numero || 0)) + 1;

// ---- fechas ----
function parseFecha(s) {
  if (!s) return null; s = String(s).trim(); let m, d, mo, y;
  if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; if (y < 100) y += 2000; }
  else if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else return null;
  const dt = new Date(y, mo - 1, d); return dt.getMonth() === mo - 1 ? dt : null;
}
const fmtFecha = s => { const d = parseFecha(s); return d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : (s || ''); };
const fechaLibro = l => parseFecha(l.final) || parseFecha(l.inicio);
const anioDe = l => { const d = fechaLibro(l); return d ? d.getFullYear() : (Number(l.anio) || null); };
const mesDe = l => { const d = fechaLibro(l); return d ? d.getMonth() : (l.mes ? MESES.indexOf(norm(l.mes)) : -1); };
const dias = l => { const a = parseFecha(l.inicio), b = parseFecha(l.final); return a && b ? Math.round(Math.abs(b - a) / 864e5) + 1 : null; };

// ---- estados / tropes ----
const esLeido = l => ['terminado', 'leido'].includes(norm(l.estado));
const esProximo = l => ['proximo', 'por leer'].includes(norm(l.estado));
function normEstado(s, l) {
  const x = norm(s);
  if (/^(terminad|leid|finaliz|read|complet)/.test(x)) return 'Terminado';
  if (/^(leyendo|en curso|reading)/.test(x)) return 'Leyendo';
  if (/^(abandon|dnf)/.test(x)) return 'Abandonado';
  if (/^(proxim|por leer|tbr|pendiente)/.test(x)) return 'Próximo';
  return l.final ? 'Terminado' : l.inicio ? 'Leyendo' : 'Próximo';
}
// Cada trope se separa por coma/;/| y se cuenta POR SEPARADO
const parseTropes = s => String(s || '').split(/[,;|\n]/).map(t => t.replace(/^["'\s]+|["'\s]+$/g, '')).filter(Boolean);
const tropesDe = l => Array.isArray(l.tropes) ? l.tropes : parseTropes(l.tropes);

// ---- años ----
function aniosDisponibles() {
  const s = new Set([ANIO_ACTUAL]);
  libros.forEach(l => { const a = anioDe(l); if (a) s.add(a); });
  Object.keys(habitTrackerData).forEach(k => s.add(+k.slice(0, 4)));
  return [...s].filter(Boolean).sort((a, b) => b - a);
}
const anioEf = () => anioSeleccionado === 'todos' ? ANIO_ACTUAL : anioSeleccionado;
const delAnio = (arr, a) => a === 'todos' ? arr : arr.filter(l => anioDe(l) === a);
function selectorAnios(permitirTodos) {
  const act = (!permitirTodos && anioSeleccionado === 'todos') ? anioEf() : anioSeleccionado;
  const b = (v, t) => `<button class="btn-anio ${act === v ? 'activo' : ''}" onclick="cambiarAnio('${v}')">${t}</button>`;
  return `<div class="selector-anio">${permitirTodos ? b('todos', 'Todos') : ''}${aniosDisponibles().map(a => b(a, a)).join('')}</div>`;
}
function cambiarAnio(v) {
  anioSeleccionado = v === 'todos' ? 'todos' : Number(v);
  Object.keys(pag).forEach(k => pag[k] = 1);
  renderVista();
}

// ---- paginación genérica (numerada + anterior/siguiente) ----
function paginar(arr, key) {
  const por = POR_PAG[key], tot = Math.max(1, Math.ceil(arr.length / por));
  pag[key] = Math.min(Math.max(1, pag[key]), tot); const p = pag[key];
  const b = (n, t, dis, act) => `<button class="btn-anio ${act ? 'activo' : ''}" ${dis ? 'disabled' : ''} onclick="irPagina('${key}',${n})">${t}</button>`;
  let h = '';
  if (tot > 1) {
    h = '<div class="selector-anio paginador">' + b(1, '«', p === 1) + b(p - 1, '‹ Anterior', p === 1);
    for (let i = 1; i <= tot; i++) {
      if (i === 1 || i === tot || Math.abs(i - p) <= 2) h += b(i, i, false, i === p);
      else if (Math.abs(i - p) === 3) h += '<span class="pag-puntos">…</span>';
    }
    h += b(p + 1, 'Siguiente ›', p === tot) + b(tot, '»', p === tot) + '</div>';
  }
  return { items: arr.slice((p - 1) * por, p * por), html: h };
}
function irPagina(k, n) { pag[k] = n; renderVista(); $('contenido').scrollTop = 0; window.scrollTo(0, 0); }

// ---- presentación ----
const SIN_PORTADA = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="130" height="190"><rect width="100%" height="100%" fill="#b5c4f6"/><text x="50%" y="55%" text-anchor="middle" font-size="40">📖</text></svg>');
const img = (u, alt) => `<img src="${esc(u || SIN_PORTADA)}" alt="${esc(alt)}" onerror="this.onerror=null;this.src='${SIN_PORTADA}'">`;
const idCl = l => norm(l.idioma || 'espanol').includes('ing') ? 'ingles' : 'espanol';
function generarEstrellas(r) {
  const n = Math.round(Number(r) || 0); return `<span style="color:#f39c12;font-size:18px">${'★'.repeat(n)}${'☆'.repeat(5 - n)}</span>`;
}
const PAL = ['#4fa8eb', '#f5a623', '#e91e63', '#50e3c2', '#9013fe', '#7ed321', '#ff7675', '#4a90e2', '#f8c51c', '#bd10e0', '#26a69a', '#fd79a8'];
function barras(titulo, filas, lw = 70) {
  if (!filas.length) return `<div class="grafica-contenedor"><h4>${titulo}</h4><p class="vacio" style="margin:10px">Sin datos</p></div>`;
  const max = Math.max(1, ...filas.map(f => f.v));
  return `<div class="grafica-contenedor"><h4>${titulo}</h4><div class="grafica-barras">${filas.map((f, i) =>
    `<div class="grafica-fila"><div class="grafica-label" style="width:${lw}px">${esc(f.l)}</div><div class="grafica-bar-bg"><div class="grafica-bar-fill" style="width:${f.v / max * 100}%;background:${PAL[i % PAL.length]}"></div></div><div class="grafica-val">${f.t ?? f.v}</div></div>`).join('')}</div></div>`;
}
const badgeEstado = l => esLeido(l) ? '' : `<span class="badge-estado ${esProximo(l) ? 'proximo' : 'leyendo'}" style="font-size:9px">${esc(l.estado)}</span>`;
function tarjeta(l, acc = '') {
  return `<div class="tarjeta-libro" onclick="verResenaLibro(${l.id})"><div class="contenedor-portada"><span class="badge-numero">${l.numero || ''}</span>${img(l.portada, l.titulo)}</div>
    <div class="estrellas">${generarEstrellas(l.rating)}</div><div class="linea-subrayado ${idCl(l)}">${esc(l.titulo)}</div>
    <div class="autor-mini">${esc(l.autor)}</div><span class="badge-idioma ${idCl(l)}">${esc(l.idioma || 'Español')}</span>${badgeEstado(l)}${acc}</div>`;
}
const BTN_IMPORTAR = `<input type="file" id="csv-libros" accept=".csv,.txt" hidden onchange="importarLibros(event)"><button class="boton-volver btn-verde" style="margin:0" onclick="$('csv-libros').click()">📂 Importar CSV</button>`;
const BTN_NUEVO = `<button class="boton-volver btn-azul" style="margin:0" onclick="formLibro(null,'Terminado')">+ Nuevo libro</button>`;

// ============ CSV (comillas, comas y saltos de línea internos) ============
function parseCSV(texto) {
  texto = texto.replace(/^\uFEFF/, '');
  const prim = texto.split(/\r?\n/)[0] || '';
  const cnt = c => prim.split(c).length - 1;
  const delim = cnt(';') > cnt(',') && cnt(';') >= cnt('\t') ? ';' : cnt('\t') > cnt(',') ? '\t' : ',';
  const filas = []; let fila = [], celda = '', dentro = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (dentro) {
      if (c === '"') { if (texto[i + 1] === '"') { celda += '"'; i++; } else dentro = false; }
      else celda += c;                       // incluye saltos de línea y comas internos
    } else if (c === '"') dentro = true;
    else if (c === delim) { fila.push(celda.trim()); celda = ''; }
    else if (c === '\r') { /* ignorar */ }
    else if (c === '\n') { fila.push(celda.trim()); filas.push(fila); fila = []; celda = ''; }
    else celda += c;
  }
  if (celda !== '' || fila.length) { fila.push(celda.trim()); filas.push(fila); }
  return filas.filter(f => f.some(x => x !== ''));
}
const COLS_LIBRO = ['titulo', 'autor', 'paginas', 'inicio', 'final', 'estado', 'rating', 'personaje1', 'personaje2', 'trope', 'idioma', 'formato', 'saga', 'portada', 'sinopsis', 'notes'];
const ALIAS = { trope: ['trope', 'tropes'], notes: ['notes', 'notas', 'opinion', 'opiniones'], paginas: ['paginas', 'pages'], personaje1: ['personaje1', 'personaje 1'], personaje2: ['personaje2', 'personaje 2'] };
function importarLibros(ev) {
  const f = ev.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    const filas = parseCSV(e.target.result);
    if (!filas.length) return alert('El archivo está vacío.');
    const cab = filas[0].map(norm), tieneCab = cab.includes('titulo'), idx = {};
    COLS_LIBRO.forEach((k, i) => idx[k] = tieneCab ? cab.findIndex(h => (ALIAS[k] || [k]).includes(h)) : i);
    if (libros.length && confirm('Aceptar = REEMPLAZAR todos tus libros por los del archivo.\nCancelar = AÑADIR sin duplicar títulos.')) libros = [];
    const claves = new Set(libros.map(l => norm(l.titulo) + '|' + norm(l.autor)));
    let n = 0, om = 0;
    filas.slice(tieneCab ? 1 : 0).forEach(fila => {
      const g = k => idx[k] >= 0 ? (fila[idx[k]] || '').trim() : '';
      if (!g('titulo')) return;
      const k = norm(g('titulo')) + '|' + norm(g('autor'));
      if (claves.has(k)) { om++; return; }
      claves.add(k);
      const rt = parseFloat(g('rating').replace(',', '.'));
      const l = {
        id: nuevoId(), numero: siguienteNumero(), titulo: g('titulo'), autor: g('autor'), paginas: Number(g('paginas').replace(/\D/g, '')) || '',
        inicio: fmtFecha(g('inicio')), final: fmtFecha(g('final')), rating: isNaN(rt) ? 0 : Math.min(5, Math.max(0, rt)),
        personaje1: g('personaje1'), personaje2: g('personaje2'), tropes: parseTropes(g('trope')), idioma: g('idioma') || 'Español',
        formato: g('formato'), saga: g('saga'), portada: g('portada'), sinopsis: g('sinopsis'), notes: g('notes')
      };
      l.estado = normEstado(g('estado'), l); libros.push(l); n++;
    });
    guardarEnLocalStorage(); alert(`${n} libro(s) importado(s)${om ? `, ${om} omitido(s) por duplicados` : ''}.`); renderVista();
  };
  r.readAsText(f, 'UTF-8'); ev.target.value = '';
}

// ============ NAVEGACIÓN ============
function mostrarPagina(p) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === p));
  vistaActual = p; Object.keys(pag).forEach(k => pag[k] = 1); renderVista();
}
function renderVista() {
  const v = {
    inicio: () => $('contenido').innerHTML = '<div class="portada-inicio"><h1>BOOK<br>JOURNAL</h1></div>',
    libreria: mostrarLibreria, estanterias: mostrarEstanterias, favorito: mostrarFavoritos, tracker: mostrarTracker, proximos: mostrarProximos,
    metas: mostrarMetas, citas: mostrarCitas, autores: mostrarAutores, registro: mostrarRegistro, estadisticas: mostrarEstadisticas,
    adaptaciones: mostrarAdaptaciones, recap: mostrarRecap
  };
  (v[vistaActual] || v.inicio)();
}

// ============ LIBRERÍA (búsqueda + filtros estrellas/tropes) ============
function mostrarLibreria() {
  const base = delAnio(libros, anioSeleccionado);
  const ts = [...new Map(base.flatMap(tropesDe).map(t => [norm(t), t])).values()].sort((x, y) => x.localeCompare(y));
  if (filtros.trope && !ts.some(t => norm(t) === filtros.trope)) filtros.trope = '';
  $('contenido').innerHTML = `
    <div class="cabecera-vista"><h2>LIBRERÍA</h2><div class="acciones">${BTN_NUEVO}${BTN_IMPORTAR}</div></div>
    ${selectorAnios(true)}
    <div class="barra-filtros">
      <input type="search" placeholder="🔍 Buscar por título o autor" value="${esc(filtros.q)}" oninput="filtros.q=this.value;gridLibreria()">
      <select onchange="filtros.est=this.value;gridLibreria()"><option value="">★ Todas las puntuaciones</option>
        ${[5, 4, 3, 2, 1].map(n => `<option value="${n}" ${filtros.est === String(n) ? 'selected' : ''}>${'★'.repeat(n)}</option>`).join('')}
        <option value="0" ${filtros.est === '0' ? 'selected' : ''}>Sin calificar</option></select>
      <select onchange="filtros.trope=this.value;gridLibreria()"><option value="">🏷️ Todos los tropes</option>
        ${ts.map(t => `<option value="${esc(norm(t))}" ${filtros.trope === norm(t) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
      <button class="boton-volver" style="margin:0" onclick="filtros={q:'',est:'',trope:''};mostrarLibreria()">Limpiar</button>
    </div>
    <p id="cont-lib" class="contador"></p><div id="grid-lib" class="lista-libros"></div>`;
  gridLibreria();
}
function gridLibreria() {
  const q = norm(filtros.q);
  const r = delAnio(libros, anioSeleccionado).filter(l =>
    (!q || norm(l.titulo).includes(q) || norm(l.autor).includes(q)) &&
    (filtros.est === '' || Math.floor(+l.rating || 0) === +filtros.est) &&
    (!filtros.trope || tropesDe(l).some(t => norm(t) === filtros.trope)));
  $('cont-lib').textContent = `${r.length} libro(s)`;
  $('grid-lib').innerHTML = r.map(l => tarjeta(l)).join('') || '<p class="vacio">No hay libros con esos filtros. Registra libros o importa tu CSV.</p>';
}
function verResenaLibro(id) {
  const l = libros.find(x => x.id === id); if (!l) return;
  const d = dias(l), tr = tropesDe(l);
  $('contenido').innerHTML = `<div class="vista-resena">
    <div class="cabecera-vista"><button class="boton-volver" style="margin:0" onclick="renderVista()">← Volver</button>
      <div><button class="boton-volver" style="background:#fef08a" onclick="formLibro(${id})">✏️ Editar</button>
      <button class="boton-volver btn-rojo" onclick="eliminarLibro(${id})">🗑️ Borrar</button></div></div>
    <div class="resena-contenido">
      <div class="columna-izquierda-resena">
        <div class="contenedor-portada" style="width:160px;height:230px"><span class="badge-numero">${l.numero || ''}</span>${img(l.portada, l.titulo)}</div>
        <div class="estrellas" style="font-size:22px;margin-top:8px">${generarEstrellas(l.rating)}</div>
        <div class="linea-subrayado ${idCl(l)}" style="text-align:center">${esc(l.titulo)}</div>
        <div style="font-size:13px;text-align:center;margin-bottom:4px">${esc(l.autor)}</div>
        <span class="badge-idioma ${idCl(l)}">${esc(l.idioma || 'Español')}</span>
        <div class="caja-notas"><h4>Tropes:</h4><ul>${tr.map(t => `<li>${esc(t)}</li>`).join('') || '<li>Sin tropes</li>'}</ul></div>
        ${(l.personaje1 || l.personaje2) ? `<div class="caja-notas" style="background:#b8e6c9"><h4>Personajes:</h4><ul>${[l.personaje1, l.personaje2].filter(Boolean).map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
      </div>
      <div class="columna-derecha-resena">
        <div class="texto-sinopsis">${esc(l.sinopsis) || 'Sin sinopsis disponible.'}</div>
        ${l.notes ? `<div class="texto-sinopsis"><b>Mis notas:</b>\n${esc(l.notes)}</div>` : ''}
        <div class="metadatos-inferior">
          <div class="metadatos-row"><span>IDIOMA: <b>${esc(l.idioma || 'Español')}</b></span><span>ESTADO: <b>${esc(l.estado)}</b></span></div>
          <div class="metadatos-row"><span>PÁGINAS: ${l.paginas || '---'}</span><span>FORMATO: ${esc(l.formato) || '---'}</span></div>
          <div class="metadatos-row"><span>SAGA: ${esc(l.saga) || 'Autoconclusivo'}</span><span>RATING: ${+l.rating || 0}/5</span></div>
          <div class="metadatos-row"><span>INICIO: ${l.inicio || '---'}</span><span>FINAL: ${l.final || '---'} ${d ? `(${d} días)` : ''}</span></div>
        </div></div></div></div>`;
}
function eliminarLibro(id) {
  const l = libros.find(x => x.id === id);
  if (l && confirm(`¿Borrar "${l.titulo}"?`)) { libros = libros.filter(x => x.id !== id); guardarEnLocalStorage(); renderVista(); }
}
function formLibro(id, estadoDef) {
  const ex = libros.find(x => x.id === id);
  const l = ex || { estado: estadoDef || 'Terminado', rating: 0, idioma: 'Español', formato: 'Físico' };
  const inp = (lab, n, v, ph = '') => `<label>${lab}</label><input id="f-${n}" value="${esc(v)}" placeholder="${ph}">`;
  const sel = (lab, n, ops, v) => { if (v && !ops.includes(v)) ops = [...ops, v]; return `<label>${lab}</label><select id="f-${n}">${ops.map(o => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`; };
  $('contenido').innerHTML = `<button class="boton-volver" onclick="renderVista()">← Volver</button><h2>${ex ? '✏️ Editar libro' : '📚 Nuevo libro'}</h2>
    <form id="form-libro" class="formulario-libro">
      ${inp('Título *', 'titulo', l.titulo || '')}${inp('Autor/a *', 'autor', l.autor || '')}${inp('Páginas', 'paginas', l.paginas || '')}
      ${inp('Inicio (dd/mm/aaaa)', 'inicio', l.inicio || '')}${inp('Final (dd/mm/aaaa)', 'final', l.final || '')}
      ${sel('Estado', 'estado', ['Terminado', 'Leyendo', 'Próximo', 'Abandonado'], l.estado)}
      <label>Rating (0-5)</label><select id="f-rating">${[0, 1, 2, 3, 4, 5].map(n => `<option ${n === Math.round(+l.rating || 0) ? 'selected' : ''}>${n}</option>`).join('')}</select>
      ${inp('Personaje 1', 'personaje1', l.personaje1 || '')}${inp('Personaje 2', 'personaje2', l.personaje2 || '')}
      <label>Tropes (separados por coma)</label><textarea id="f-tropes" rows="2" placeholder="enemies to lovers, slow burn">${esc(tropesDe(l).join(', '))}</textarea>
      ${sel('Idioma', 'idioma', ['Español', 'Inglés', 'Portugués', 'Francés'], l.idioma)}${sel('Formato', 'formato', ['Físico', 'Ebook', 'Audiolibro'], l.formato)}
      ${inp('Saga', 'saga', l.saga || '')}${inp('Portada (URL)', 'portada', l.portada || '')}
      <label>Sinopsis</label><textarea id="f-sinopsis" rows="4">${esc(l.sinopsis || '')}</textarea>
      <label>Notas / opiniones</label><textarea id="f-notes" rows="4">${esc(l.notes || '')}</textarea>
      <button type="submit">Guardar</button></form>`;
  $('form-libro').onsubmit = e => {
    e.preventDefault(); const g = n => $('f-' + n).value.trim();
    if (!g('titulo')) return alert('El título es obligatorio.');
    const d = { titulo: g('titulo'), autor: g('autor'), paginas: Number(g('paginas')) || '', inicio: fmtFecha(g('inicio')), final: fmtFecha(g('final')), estado: g('estado'), rating: Number(g('rating')) || 0,
      personaje1: g('personaje1'), personaje2: g('personaje2'), tropes: parseTropes(g('tropes')), idioma: g('idioma'), formato: g('formato'), saga: g('saga'), portada: g('portada'), sinopsis: g('sinopsis'), notes: g('notes') };
    if (ex) Object.assign(ex, d); else libros.push({ id: nuevoId(), numero: siguienteNumero(), ...d });
    guardarEnLocalStorage(); renderVista();
  };
}

// ============ PRÓXIMOS (paginado) ============
function mostrarProximos() {
  const p = paginar(libros.filter(esProximo), 'proximos');
  const cards = p.items.map(l => tarjeta(l, `<div class="acc-card">
    <button class="btn-tabla-accion" style="background:#a3e4d7" onclick="event.stopPropagation();marcarComoTerminado(${l.id})">✅ Leído</button>
    <button class="btn-tabla-accion" onclick="event.stopPropagation();formLibro(${l.id})">✏️</button>
    <button class="btn-tabla-accion" onclick="event.stopPropagation();eliminarLibro(${l.id})">🗑️</button></div>`)).join('');
  $('contenido').innerHTML = `<div class="cabecera-vista"><h2>⏳ Libros Próximos (TBR)</h2><button class="boton-volver btn-azul" style="margin:0" onclick="formLibro(null,'Próximo')">+ Añadir Próximo</button></div>
    <div class="lista-libros">${cards || '<p class="vacio">No tienes libros próximos.</p>'}</div>${p.html}`;
}
function marcarComoTerminado(id) {
  const l = libros.find(x => x.id === id);
  if (l && confirm(`¿Marcar "${l.titulo}" como Terminado? Se usará la fecha de hoy como final si no tiene.`)) {
    l.estado = 'Terminado'; if (!parseFecha(l.final)) l.final = fmtFecha(new Date().toLocaleDateString('en-CA'));
    guardarEnLocalStorage(); renderVista();
  }
}

// ============ METAS ============
function mostrarMetas() {
  const a = anioEf(), T = delAnio(libros, a).filter(esLeido);
  const totL = T.length, totP = T.reduce((s, l) => s + (+l.paginas || 0), 0);
  const html = metas.map(m => {
    let act = m.actual; const t = norm(m.titulo);
    if (t.includes('pagina')) act = totP; else if (t.includes('libro')) act = totL;
    const pc = Math.min(100, Math.round(act / m.objetivo * 100)), ok = act >= m.objetivo || m.completada;
    return `<div class="meta-item-card"><input type="checkbox" class="meta-checkbox" ${ok ? 'checked' : ''} onchange="toggleMeta(${m.id})">
      <div class="meta-info"><div class="meta-titulo">${esc(m.titulo)} (${act} / ${m.objetivo})</div><div class="meta-progreso-bar"><div class="meta-progreso-fill" style="width:${pc}%"></div></div></div>
      <button onclick="eliminarMeta(${m.id})" class="btn-tabla-accion">🗑️</button></div>`;
  }).join('');
  $('contenido').innerHTML = `<div class="contenedor-metas"><div class="cabecera-vista"><h2>🎯 Metas de Lectura ${a}</h2><button onclick="formMeta()" class="boton-volver btn-azul" style="margin:0">+ Nueva Meta</button></div>
    ${selectorAnios(false)}${html || '<p class="vacio">No tienes metas.</p>'}</div>`;
}
function toggleMeta(id) { const m = metas.find(x => x.id === id); if (m) { m.completada = !m.completada; guardarEnLocalStorage(); mostrarMetas(); } }
function eliminarMeta(id) { if (confirm('¿Borrar esta meta?')) { metas = metas.filter(x => x.id !== id); guardarEnLocalStorage(); mostrarMetas(); } }
function formMeta() {
  $('contenido').innerHTML = `<button onclick="mostrarMetas()" class="boton-volver">← Volver</button><h2>🎯 Nueva Meta</h2>
    <form id="form-meta" class="formulario-libro"><label>Descripción</label><input id="m-titulo" required placeholder="Ej. Leer 12 libros">
    <label>Objetivo numérico</label><input type="number" id="m-objetivo" required value="10"><button type="submit">Guardar</button></form>`;
  $('form-meta').onsubmit = e => { e.preventDefault(); metas.push({ id: nuevoId(), titulo: $('m-titulo').value, objetivo: Number($('m-objetivo').value), actual: 0, completada: false }); guardarEnLocalStorage(); mostrarMetas(); };
}

// ============ ESTANTERÍAS (por año, muchos colores) ============
const LOMOS = ['#e57373', '#f06292', '#ba68c8', '#9575cd', '#7986cb', '#64b5f6', '#4fc3f7', '#4dd0e1', '#4db6ac', '#81c784', '#aed581', '#dce775', '#fff176', '#ffd54f', '#ffb74d', '#ff8a65', '#a1887f', '#90a4ae', '#ef5350', '#ec407a', '#ab47bc', '#5c6bc0', '#26a69a', '#66bb6a', '#d4e157', '#ffca28', '#ffa726', '#8d6e63', '#26c6da', '#42a5f5', '#c2185b', '#00897b', '#f9a825', '#6a1b9a'];
const hash = s => { let h = 5381; for (const c of String(s)) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h; };
const textoSobre = hex => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .299 + ((n >> 8) & 255) * .587 + (n & 255) * .114) > 150 ? '#1a1a1a' : '#fff'; };
function mostrarEstanterias() {
  const a = anioEf(), T = delAnio(libros, a).filter(esLeido);
  const ancho = $('contenido').clientWidth || 700, por = Math.max(5, Math.floor((ancho - 90) / 46));
  let h = '';
  for (let i = 0; i < T.length; i += por) {
    h += `<div class="repisa-madera">${T.slice(i, i + por).map(l => {
      const k = hash(l.titulo + l.id), c = LOMOS[k % LOMOS.length], alto = 120 + (k >> 3) % 55, anc = 28 + (k >> 5) % 16;
      const bandas = k % 3 ? 'linear-gradient(to bottom,transparent 10%,rgba(255,255,255,.4) 10% 14%,transparent 14% 86%,rgba(255,255,255,.4) 86% 90%,transparent 90%),' : '';
      return `<div class="libro-tomo" onclick="verResenaLibro(${l.id})" title="${esc(l.titulo)}" style="background:${bandas}${c};height:${alto}px;width:${anc}px"><span style="color:${textoSobre(c)}">${esc(l.titulo)}</span></div>`;
    }).join('')}</div>`;
  }
  $('contenido').innerHTML = `<h2 style="text-align:center">ESTANTERÍA ${a}</h2>${selectorAnios(false)}
    <p class="contador" style="text-align:center">${T.length} libro(s) terminados</p>
    <div class="estanteria-contenedor">${h || '<p class="vacio">No hay libros terminados en este año.</p>'}</div>`;
}

// ============ FAVORITOS DEL MES (auto por rating; empate = manual) ============
function leidosMes(a, m) { return libros.filter(l => esLeido(l) && anioDe(l) === a && mesDe(l) === m); }
function favoritosAuto(lista) {
  const r = lista.filter(l => +l.rating > 0), res = [null, null];
  const niv = [...new Set(r.map(l => +l.rating))].sort((x, y) => y - x);
  const top = r.filter(l => +l.rating === niv[0]);
  if (top.length !== 1) return res;               // empate -> vacío para llenado manual
  res[0] = top[0];
  if (niv.length > 1) { const s = r.filter(l => +l.rating === niv[1]); if (s.length === 1) res[1] = s[0]; }
  return res;
}
function favoritosMes(a, m) {
  const lista = leidosMes(a, m), auto = favoritosAuto(lista), man = favManual[`${a}-${m}`] || [null, null];
  const res = [0, 1].map(i => (man[i] && libros.find(l => l.id === man[i])) || auto[i] || null);
  if (res[0] && res[1] && res[0].id === res[1].id) res[1] = null;
  return { res, lista, man };
}
function mostrarFavoritos() {
  const a = anioEf();
  const h = MESES.map((mes, m) => {
    const { res, lista, man } = favoritosMes(a, m);
    const slot = i => {
      const l = res[i];
      if (l) return `<div class="portada-slot slot-fav" onclick="verResenaLibro(${l.id})">${img(l.portada, l.titulo)}<div class="mini-acc"><button title="Cambiar" onclick="event.stopPropagation();elegirFavorito(${a},${m},${i})">✎</button>${man[i] ? `<button title="Quitar elección manual" onclick="event.stopPropagation();quitarFavorito(${a},${m},${i})">✖</button>` : ''}</div></div>`;
      if (!lista.length) return `<div class="portada-slot"><span>Sin lecturas</span></div>`;
      return `<div class="portada-slot vacia" onclick="elegirFavorito(${a},${m},${i})"><span>+ Elegir favorito ${i + 1}</span></div>`;
    };
    return `<div class="tarjeta-mes-fav"><div class="nombre-mes-cursiva">${mes}</div><div class="slot-portadas">${slot(0)}${slot(1)}</div></div>`;
  }).join('');
  $('contenido').innerHTML = `<div class="contenedor-favoritos"><h2 style="text-align:center">FAVORITO DEL MES (${a})</h2>${selectorAnios(false)}
    <p class="contador" style="text-align:center">Se llenan solos con la mejor puntuación del mes. Si hay empate quedan vacíos para elegir a mano.</p>
    <div class="grilla-favoritos-meses">${h}</div></div>`;
}
function elegirFavorito(a, m, i) {
  const { res, lista } = favoritosMes(a, m), otro = res[1 - i];
  const op = lista.filter(l => !otro || l.id !== otro.id);
  $('contenido').innerHTML = `<button class="boton-volver" onclick="mostrarFavoritos()">← Volver</button><h2 style="text-align:center">Favorito ${i + 1} de ${MESES[m]} ${a}</h2>
    <div class="lista-elegir">${op.map(l => `<button onclick="guardarFavorito(${a},${m},${i},${l.id})">${generarEstrellas(l.rating)} <b>${esc(l.titulo)}</b> — ${esc(l.autor)}</button>`).join('')}</div>`;
}
function guardarFavorito(a, m, i, id) { const k = `${a}-${m}`; favManual[k] = favManual[k] || [null, null]; favManual[k][i] = id; guardarEnLocalStorage(); mostrarFavoritos(); }
function quitarFavorito(a, m, i) { const k = `${a}-${m}`; if (favManual[k]) favManual[k][i] = null; guardarEnLocalStorage(); mostrarFavoritos(); }

// ============ RECAP ============
function resumenCirculos(T) { return `<div class="recap-stats-centradas"><div class="recap-circulo-stat"><span>Libros leídos</span><div class="recap-circulo-badge">${T.length}</div></div><div class="recap-circulo-stat"><span>Páginas leídas</span><div class="recap-circulo-badge" style="width:80px;height:80px;font-size:16px">${T.reduce((s, l) => s + (+l.paginas || 0), 0)}</div></div></div>`; }
const top3Html = T => `<div class="recap-top3-contenedor">${[...T].sort((x, y) => (+y.rating || 0) - (+x.rating || 0)).slice(0, 3).map(l => `<div class="recap-top3-card" onclick="verResenaLibro(${l.id})" style="cursor:pointer">${img(l.portada, l.titulo)}<strong>${esc(l.titulo)}</strong><div class="estrellas">${generarEstrellas(l.rating)}</div></div>`).join('') || '<p class="vacio">Sin lecturas registradas.</p>'}</div>`;
function mostrarRecap() {
  const a = anioEf(), T = delAnio(libros, a).filter(esLeido);
  const meses = MESES.map((mes, m) => `<div class="tarjeta-mes" onclick="recapMes(${m})"><h4 style="font-family:'Caveat',cursive;font-size:22px">${cap(mes)}</h4><p>Leídos: <strong>${T.filter(l => mesDe(l) === m).length}</strong></p></div>`).join('');
  $('contenido').innerHTML = `<h2>📊 Recap ${a}</h2>${selectorAnios(false)}<h3 style="text-align:center">Mejores lecturas del año</h3>${top3Html(T)}${resumenCirculos(T)}<h3 style="text-align:center;margin-top:25px">Recap por mes</h3><div class="grilla-meses">${meses}</div>`;
}
function recapMes(m) {
  const a = anioEf(), T = leidosMes(a, m), o = [...T].sort((x, y) => (+y.rating || 0) - (+x.rating || 0));
  const caja = (t, l) => `<div class="formulario-libro"><h4>${t}</h4>${l ? `<strong>${esc(l.titulo)}</strong><div class="estrellas">${generarEstrellas(l.rating)}</div>` : 'Sin registros'}</div>`;
  $('contenido').innerHTML = `<button class="boton-volver" onclick="mostrarRecap()">← Volver al Recap</button>
    <h2 style="font-family:'Caveat',cursive;font-size:36px;text-align:center">${cap(MESES[m])} ${a}</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">${caja('Más gustado', o[0])}${caja('Menos gustado', o[o.length - 1])}</div>
    <h3 style="text-align:center;margin-top:20px">Top 3 Mejores Lecturas</h3>${top3Html(T)}${resumenCirculos(T)}`;
}

// ============ TRACKER ============
function claseRango(p) {
  if (p === undefined || p === null || p === '') return 'rango-vacio';
  const n = Number(p); return n <= 10 ? 'rango-0-10' : n <= 20 ? 'rango-11-20' : n <= 30 ? 'rango-21-30' : n <= 40 ? 'rango-31-40' : n <= 50 ? 'rango-41-50' : n <= 80 ? 'rango-51-80' : n <= 100 ? 'rango-81-100' : 'rango-100-plus';
}
function mostrarTracker() {
  const a = anioEf(); let filas = '', tot = 0;
  for (let d = 1; d <= 31; d++) {
    let c = '';
    MESES.forEach((m, i) => {
      if (d > new Date(a, i + 1, 0).getDate()) { c += '<td class="rango-invalido"></td>'; return; }
      const k = `${a}-${String(i + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; tot += Number(habitTrackerData[k]) || 0;
      c += `<td class="celda-tracker ${claseRango(habitTrackerData[k])}" title="${habitTrackerData[k] || ''}" onclick="registrarPaginasDia('${k}',${d},'${m}')"></td>`;
    });
    filas += `<tr><th style="font-size:10px">${d}</th>${c}</tr>`;
  }
  const ley = [['rango-0-10', '0-10'], ['rango-11-20', '11-20'], ['rango-21-30', '21-30'], ['rango-31-40', '31-40'], ['rango-41-50', '41-50'], ['rango-51-80', '51-80'], ['rango-81-100', '81-100'], ['rango-100-plus', '100+']];
  $('contenido').innerHTML = `<h2 style="text-align:center">READING TRACKER (${a})</h2>${selectorAnios(false)}
    <p class="contador" style="text-align:center">Páginas registradas en el año: <b>${tot}</b></p>
    <div class="tracker-anual-container"><div class="tracker-tabla-wrapper"><table class="tabla-tracker-anual"><thead><tr><th></th>${MESES.map(m => `<th class="th-mes"><div class="th-mes-texto">${cap(m)}</div></th>`).join('')}</tr></thead><tbody>${filas}</tbody></table></div>
    <div class="tracker-leyenda-horizontal">${ley.map(([c, t]) => `<div class="leyenda-item"><div class="leyenda-color-box ${c}"></div><span>${t}</span></div>`).join('')}</div></div>`;
}
function registrarPaginasDia(k, d, m) {
  const v = prompt(`Páginas leídas el ${d} de ${m}:`, habitTrackerData[k] || ''); if (v === null) return;
  if (v.trim() === '') delete habitTrackerData[k]; else habitTrackerData[k] = Number(v) || 0;
  guardarEnLocalStorage(); mostrarTracker();
}

// ============ CITAS (10 por página) ============
const COLORES_ANIO = { 2026: '#b5e3fd', 2025: '#ffd1dc', 2024: '#e2f0cb', 2023: '#d8b4f8', 2022: '#ffffba', 2021: '#ffdfba' };
const numLibro = t => { const l = libros.find(x => norm(x.titulo) === norm(t)); return l ? (l.numero || '') : ''; };
function mostrarCitas() {
  const top = k => { const m = {}; citas.forEach(c => { if (c[k]) m[c[k]] = (m[c[k]] || 0) + 1; }); return Object.entries(m).sort((x, y) => y[1] - x[1])[0]?.[0] || '---'; };
  const acciones = `<div class="acciones"><button onclick="formCita()" class="boton-volver btn-azul" style="margin:0">+ Nueva Cita</button>
    <input type="file" id="csv-citas" accept=".csv,.txt" hidden onchange="importarCitasCSV(event)"><button onclick="$('csv-citas').click()" class="boton-volver btn-verde" style="margin:0">📂 CSV</button>
    <button onclick="vaciarCitas()" class="boton-volver btn-rojo" style="margin:0">🗑️ Vaciar</button></div>`;
  const p = paginar(citas, 'citas');
  const lista = p.items.map(c => `<div class="tarjeta-cita-planner"><div class="cita-metadatos">
      ${[['LIBRO', c.libro], ['AUTOR/A', c.autor], ['CAPÍTULO', c.capitulo], ['PÁGINA', c.pagina], ['AÑO', c.anio], ['FECHA', c.fecha]].map(([t, v]) => `<div class="cita-meta-fila">${t}: <span>${esc(v) || '---'}</span></div>`).join('')}
      <div style="margin-top:10px;display:flex;gap:6px"><button onclick="formCita(${c.id})" class="btn-tabla-accion" style="background:#fef08a">✏️ Editar</button><button onclick="eliminarCita(${c.id})" class="btn-tabla-accion btn-rojo">🗑️ Borrar</button></div></div>
      <div class="cita-caja-texto" style="background:${COLORES_ANIO[c.anio] || '#b5e3fd'}"><div class="cita-badge-numero">${numLibro(c.libro)}</div><blockquote class="notas-texto">"${esc(c.texto)}"</blockquote></div></div>`).join('');
  $('contenido').innerHTML = `<div class="cabecera-vista"><h2>CITAS DE LECTURA</h2>${acciones}</div>
    <div class="panel-destacados-grid"><div class="card-destacado"><span>Total Citas</span><strong>${citas.length}</strong></div><div class="card-destacado"><span>Autora Top</span><strong>${esc(top('autor'))}</strong></div><div class="card-destacado"><span>Libro Top</span><strong>${esc(top('libro'))}</strong></div><div class="card-destacado"><span>Año Top</span><strong>${esc(top('anio'))}</strong></div></div>
    <div class="contenedor-citas-planner">${lista || '<p class="vacio">No tienes citas guardadas todavía.</p>'}</div>${p.html}`;
}
function formCita(id) {
  const c = citas.find(x => x.id === id) || {}; const inp = (t, n, v) => `<label>${t}</label><input id="c-${n}" value="${esc(v || '')}">`;
  $('contenido').innerHTML = `<button class="boton-volver" onclick="mostrarCitas()">← Volver</button><h2>${id ? '✏️ Editar cita' : '💬 Nueva cita'}</h2>
    <form id="form-cita" class="formulario-libro"><label>Texto *</label><textarea id="c-texto" rows="5" required>${esc(c.texto || '')}</textarea>
    <label>Libro</label><input id="c-libro" list="dl-libros" value="${esc(c.libro || '')}"><datalist id="dl-libros">${libros.map(l => `<option value="${esc(l.titulo)}">`).join('')}</datalist>
    ${inp('Autor/a', 'autor', c.autor)}${inp('Capítulo', 'capitulo', c.capitulo)}${inp('Página', 'pagina', c.pagina)}${inp('Año', 'anio', c.anio || ANIO_ACTUAL)}${inp('Fecha', 'fecha', c.fecha)}<button type="submit">Guardar</button></form>`;
  $('c-libro').onchange = () => { const l = libros.find(x => norm(x.titulo) === norm($('c-libro').value)); if (l && !$('c-autor').value) $('c-autor').value = l.autor; };
  $('form-cita').onsubmit = e => {
    e.preventDefault(); const g = n => $('c-' + n).value.trim();
    const d = { texto: g('texto'), libro: g('libro'), autor: g('autor'), capitulo: g('capitulo'), pagina: g('pagina'), anio: g('anio'), fecha: g('fecha') };
    if (id) Object.assign(c, d); else citas.push({ id: nuevoId(), ...d }); guardarEnLocalStorage(); mostrarCitas();
  };
}
function eliminarCita(id) { if (confirm('¿Borrar esta cita?')) { citas = citas.filter(c => c.id !== id); guardarEnLocalStorage(); mostrarCitas(); } }
function vaciarCitas() { if (citas.length && confirm('¿Borrar TODAS las citas?')) { citas = []; guardarEnLocalStorage(); mostrarCitas(); } }
function importarCitasCSV(ev) {
  const f = ev.target.files[0]; if (!f) return; const r = new FileReader();
  r.onload = e => {
    const filas = parseCSV(e.target.result), cab = filas[0] ? filas[0].map(norm) : [], tieneCab = cab.includes('texto');
    const cols = ['texto', 'libro', 'autor', 'capitulo', 'pagina', 'anio', 'fecha'], ix = {};
    cols.forEach((k, i) => ix[k] = tieneCab ? cab.indexOf(k) : i);
    let n = 0;
    filas.slice(tieneCab ? 1 : 0).forEach(fila => {
      const g = k => ix[k] >= 0 ? (fila[ix[k]] || '').trim() : ''; if (!g('texto')) return;
      citas.push({ id: nuevoId(), texto: g('texto'), libro: g('libro'), autor: g('autor'), capitulo: g('capitulo'), pagina: g('pagina'), anio: g('anio') || (parseFecha(g('fecha'))?.getFullYear() || ANIO_ACTUAL), fecha: g('fecha') }); n++;
    });
    guardarEnLocalStorage(); alert(`${n} cita(s) importada(s).`); pag.citas = 1; mostrarCitas();
  };
  r.readAsText(f, 'UTF-8'); ev.target.value = '';
}

// ============ AUTORES (paginado) ============
function mostrarAutores() {
  const m = new Map(); libros.forEach(l => { if (!l.autor) return; const k = norm(l.autor); const o = m.get(k) || { n: l.autor, c: 0 }; o.c++; m.set(k, o); });
  const p = paginar([...m.values()].sort((x, y) => x.n.localeCompare(y.n)), 'autores');
  $('contenido').innerHTML = `<div class="autores-index-container"><h2>👩 Autores (${m.size})</h2>
    <div class="autores-grid-3cols">${p.items.map(o => `<button class="autor-btn-item" onclick="abrirAutor('${encodeURIComponent(o.n)}')">${esc(o.n)} <small>(${o.c})</small></button>`).join('') || '<p class="vacio">Aún no hay autores.</p>'}</div>${p.html}</div>`;
}
function abrirAutor(enc) {
  const n = decodeURIComponent(enc), L = libros.filter(l => norm(l.autor) === norm(n)), cal = L.filter(l => +l.rating > 0);
  $('contenido').innerHTML = `<button class="boton-volver" onclick="mostrarAutores()">← Autores</button><h2>${esc(n)}</h2>
    <p class="contador">${L.length} libro(s) · ${L.reduce((s, l) => s + (+l.paginas || 0), 0)} páginas · promedio ${cal.length ? (cal.reduce((s, l) => s + +l.rating, 0) / cal.length).toFixed(1) : '—'} ★ · ${citas.filter(c => norm(c.autor) === norm(n)).length} cita(s)</p>
    <div class="lista-libros">${L.map(l => tarjeta(l)).join('')}</div>`;
}

// ============ REGISTRO (año + estado, paginado) ============
let filtroEstado = '';
function mostrarRegistro() {
  const L = delAnio(libros, anioSeleccionado).filter(l => !filtroEstado || l.estado === filtroEstado), T = L.filter(esLeido);
  const cal = T.filter(l => +l.rating > 0), ds = T.map(dias).filter(Boolean);
  const p = paginar(L, 'registro');
  const filas = p.items.map(l => `<tr><td>${l.numero || ''}</td><td style="text-align:left;cursor:pointer" onclick="verResenaLibro(${l.id})"><b>${esc(l.titulo)}</b></td><td>${esc(l.autor)}</td><td>${l.paginas || ''}</td><td>${l.inicio || ''}</td><td>${l.final || ''}</td>
    <td>${dias(l) || ''}</td><td><span class="badge-estado ${esLeido(l) ? 'terminado' : esProximo(l) ? 'proximo' : 'leyendo'}">${esc(l.estado)}</span></td><td>${generarEstrellas(l.rating)}</td>
    <td><button class="btn-tabla-accion" onclick="formLibro(${l.id})">✏️</button><button class="btn-tabla-accion" onclick="eliminarLibro(${l.id})">🗑️</button></td></tr>`).join('');
  $('contenido').innerHTML = `<div class="contenedor-registro-planner"><div class="cabecera-vista"><h2>📝 Registro</h2><div class="acciones">${BTN_NUEVO}${BTN_IMPORTAR}</div></div>${selectorAnios(true)}
    <div class="barra-filtros"><select onchange="filtroEstado=this.value;pag.registro=1;mostrarRegistro()"><option value="">Todos los estados</option>${['Terminado', 'Leyendo', 'Próximo', 'Abandonado'].map(s => `<option ${filtroEstado === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    <div class="panel-destacados-grid"><div class="card-destacado"><span>Registros</span><strong>${L.length}</strong></div><div class="card-destacado"><span>Páginas leídas</span><strong>${T.reduce((s, l) => s + (+l.paginas || 0), 0)}</strong></div>
    <div class="card-destacado"><span>Rating promedio</span><strong>${cal.length ? (cal.reduce((s, l) => s + +l.rating, 0) / cal.length).toFixed(2) : '—'}</strong></div><div class="card-destacado"><span>Días por libro</span><strong>${ds.length ? Math.round(ds.reduce((a, b) => a + b, 0) / ds.length) : '—'}</strong></div></div>
    <div class="tabla-wrapper"><table class="tabla-registro-planner"><thead><tr><th>#</th><th>Título</th><th>Autor/a</th><th>Págs</th><th>Inicio</th><th>Final</th><th>Días</th><th>Estado</th><th>Rating</th><th></th></tr></thead><tbody>${filas || '<tr><td colspan="10">Sin registros</td></tr>'}</tbody></table></div>${p.html}</div>`;
}

// ============ ESTADÍSTICAS ============
function statsTropes(T) {
  const m = new Map();
  T.forEach(l => { const v = new Set(); tropesDe(l).forEach(t => { const k = norm(t); if (!k || v.has(k)) return; v.add(k); const o = m.get(k) || { n: t, c: 0, s: 0, r: 0 }; o.c++; if (+l.rating > 0) { o.s += +l.rating; o.r++; } m.set(k, o); }); });
  return [...m.values()];
}
function mostrarEstadisticas() {
  const a = anioSeleccionado, T = delAnio(libros, a).filter(esLeido), cal = T.filter(l => +l.rating > 0);
  const pags = l => +l.paginas || 0, ds = T.map(dias).filter(Boolean);
  const cuenta = (arr, fn) => { const m = {}; arr.forEach(x => { const k = fn(x) || '—'; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((x, y) => y[1] - x[1]); };
  const largo = [...T].sort((x, y) => pags(y) - pags(x))[0], mejor = [...cal].sort((x, y) => y.rating - x.rating)[0], autor = cuenta(T, l => l.autor)[0];
  const card = (t, v) => `<div class="card-destacado"><span>${t}</span><strong>${v}</strong></div>`;
  const porPeriodo = a === 'todos' ? [...aniosDisponibles()].reverse().map(y => ({ l: String(y), T: T.filter(l => anioDe(l) === y) })) : MESES.map((m, i) => ({ l: cap(m).slice(0, 3), T: T.filter(l => mesDe(l) === i) }));
  // Tropes: cada trope se cuenta por separado
  const tr = statsTropes(T).sort(modoTropes === 'mas' ? (x, y) => y.c - x.c || x.n.localeCompare(y.n) : (x, y) => x.c - y.c || x.n.localeCompare(y.n));
  const tb = (m, t) => `<button class="btn-anio ${modoTropes === m ? 'activo' : ''}" onclick="modoTropes='${m}';mostrarEstadisticas()">${t}</button>`;
  let comp = '';
  if (a !== 'todos') {
    const P = delAnio(libros, a - 1).filter(esLeido);
    comp = `<div class="tabla-wrapper"><table class="tabla-comparativa-meses"><thead><tr><th>Mes</th><th>Libros ${a}</th><th>Libros ${a - 1}</th><th>Págs ${a}</th><th>Págs ${a - 1}</th></tr></thead><tbody>${MESES.map((m, i) => {
      const x = T.filter(l => mesDe(l) === i), y = P.filter(l => mesDe(l) === i); return `<tr><td>${cap(m)}</td><td>${x.length}</td><td>${y.length}</td><td>${x.reduce((s, l) => s + pags(l), 0)}</td><td>${y.reduce((s, l) => s + pags(l), 0)}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  $('contenido').innerHTML = `<div class="contenedor-registro-planner"><h2>📈 Estadísticas ${a === 'todos' ? '(todos los años)' : a}</h2>${selectorAnios(true)}
    <div class="panel-destacados-grid">${card('Libros leídos', T.length)}${card('Páginas', T.reduce((s, l) => s + pags(l), 0))}${card('Rating promedio', cal.length ? (cal.reduce((s, l) => s + +l.rating, 0) / cal.length).toFixed(2) + ' ★' : '—')}${card('Días por libro', ds.length ? Math.round(ds.reduce((x, y) => x + y, 0) / ds.length) : '—')}
    ${card('Más largo', largo ? esc(largo.titulo) : '—')}${card('Mejor calificado', mejor ? esc(mejor.titulo) : '—')}${card('Autor/a top', autor ? esc(autor[0]) : '—')}${card('Mes más lector', a === 'todos' ? '—' : (() => { const b = [...porPeriodo].sort((x, y) => y.T.length - x.T.length)[0]; return b && b.T.length ? b.l : '—'; })())}</div>
    <div class="grafica-contenedor"><h4>🏷️ Top 5 de tropes (cada trope por separado)</h4><div class="selector-anio">${tb('mas', '🔝 Más leídos')}${tb('menos', '🔻 Menos leídos')}</div>
    ${barras('', tr.slice(0, 5).map(o => ({ l: o.n, v: o.c, t: `${o.c}${o.r ? ` · ${(o.s / o.r).toFixed(1)}★` : ''}` })), 130).replace(/<h4><\/h4>/, '')}<p class="contador" style="text-align:center">${tr.length} tropes distintos en libros terminados</p></div>
    ${barras(a === 'todos' ? 'Libros por año' : 'Libros por mes', porPeriodo.map(p => ({ l: p.l, v: p.T.length })))}
    ${barras(a === 'todos' ? 'Páginas por año' : 'Páginas por mes', porPeriodo.map(p => ({ l: p.l, v: p.T.reduce((s, l) => s + pags(l), 0) })))}
    ${barras('Calificaciones', [5, 4, 3, 2, 1].map(n => ({ l: '★'.repeat(n), v: cal.filter(l => Math.floor(l.rating) === n).length })))}
    ${barras('Idiomas', cuenta(T, l => l.idioma || 'Español').map(([k, v]) => ({ l: k, v })))}${barras('Formatos', cuenta(T, l => l.formato).map(([k, v]) => ({ l: k, v })))}
    ${barras('Autores más leídos', cuenta(T, l => l.autor).slice(0, 5).map(([k, v]) => ({ l: k, v })), 110)}${comp}</div>`;
}

// ============ ADAPTACIONES (paginado) ============
function mostrarAdaptaciones() {
  const p = paginar(adaptaciones, 'adaptaciones');
  const fila = (t, v) => `<div class="adaptacion-info-fila">${t}: <span>${esc(v) || '---'}</span></div>`;
  const html = p.items.map(ad => {
    const l = libros.find(x => norm(x.titulo) === norm(ad.libro));
    return `<div class="adaptacion-card-detalle"><div style="position:absolute;top:10px;right:10px"><button class="btn-tabla-accion" onclick="formAdaptacion(${ad.id})">✏️</button><button class="btn-tabla-accion" onclick="eliminarAdaptacion(${ad.id})">🗑️</button></div>
      <div class="adaptacion-grid-comparativa">
        <div class="adaptacion-columna-media"><div style="position:relative">${img(l && l.portada, ad.libro).replace('<img', '<img class="adaptacion-poster"')}</div><strong>📖 ${esc(ad.libro)}</strong><div class="adaptacion-info-detalles">${fila('Autor/a', l && l.autor)}<div class="adaptacion-info-fila">Mi rating: ${generarEstrellas(l && l.rating)}</div></div></div>
        <div class="adaptacion-divisor-vertical"></div>
        <div class="adaptacion-columna-media">${img(ad.poster, ad.titulo).replace('<img', '<img class="adaptacion-poster"')}<strong>🎬 ${esc(ad.titulo)}</strong><div class="adaptacion-info-detalles">${fila('Tipo', ad.tipo)}${fila('Estreno', ad.estreno)}${fila('Plataforma', ad.plataforma)}${fila('Estado', ad.estado)}<div class="adaptacion-info-fila">Mi rating: ${generarEstrellas(ad.rating)}</div></div></div></div>
      ${ad.opinion ? `<p class="notas-texto" style="margin-top:15px;font-size:13px">${esc(ad.opinion)}</p>` : ''}</div>`;
  }).join('');
  $('contenido').innerHTML = `<div class="cabecera-vista"><h2>🎬 Adaptaciones</h2><button class="boton-volver btn-azul" style="margin:0" onclick="formAdaptacion()">+ Nueva adaptación</button></div>${html || '<p class="vacio">Aún no tienes adaptaciones registradas.</p>'}${p.html}`;
}
function formAdaptacion(id) {
  const a = adaptaciones.find(x => x.id === id) || {}; const inp = (t, n, v) => `<label>${t}</label><input id="a-${n}" value="${esc(v || '')}">`;
  const sel = (t, n, ops, v) => `<label>${t}</label><select id="a-${n}">${ops.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  $('contenido').innerHTML = `<button class="boton-volver" onclick="mostrarAdaptaciones()">← Volver</button><h2>${id ? '✏️ Editar' : '🎬 Nueva'} adaptación</h2><form id="form-ad" class="formulario-libro">
    <label>Libro *</label><input id="a-libro" list="dl-l2" required value="${esc(a.libro || '')}"><datalist id="dl-l2">${libros.map(l => `<option value="${esc(l.titulo)}">`).join('')}</datalist>
    ${inp('Título de la adaptación *', 'titulo', a.titulo)}${sel('Tipo', 'tipo', ['Película', 'Serie', 'Anime', 'Otro'], a.tipo)}${inp('Año de estreno', 'estreno', a.estreno)}${inp('Plataforma', 'plataforma', a.plataforma)}
    ${sel('Estado', 'estado', ['Por ver', 'Viendo', 'Vista'], a.estado)}${sel('Rating (0-5)', 'rating', ['0', '1', '2', '3', '4', '5'], String(a.rating || 0))}${inp('Póster (URL)', 'poster', a.poster)}
    <label>Opinión</label><textarea id="a-opinion" rows="4">${esc(a.opinion || '')}</textarea><button type="submit">Guardar</button></form>`;
  $('form-ad').onsubmit = e => {
    e.preventDefault(); const g = n => $('a-' + n).value.trim();
    const d = { libro: g('libro'), titulo: g('titulo'), tipo: g('tipo'), estreno: g('estreno'), plataforma: g('plataforma'), estado: g('estado'), rating: Number(g('rating')), poster: g('poster'), opinion: g('opinion') };
    if (id) Object.assign(a, d); else adaptaciones.push({ id: nuevoId(), ...d }); guardarEnLocalStorage(); mostrarAdaptaciones();
  };
}
function eliminarAdaptacion(id) { if (confirm('¿Borrar esta adaptación?')) { adaptaciones = adaptaciones.filter(x => x.id !== id); guardarEnLocalStorage(); mostrarAdaptaciones(); } }

// ============ INICIO ============
mostrarPagina('inicio');