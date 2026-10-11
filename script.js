// --- BASE DE DATOS LOCAL ---
let libros = JSON.parse(localStorage.getItem("libros")) || [
    { id: 1, titulo: "Libro de ejemplo 1", autor: "Autor de ejemplo", paginas: 350, estado: "Leído", rating: 5, genero: "Romance", anio: 2026, mes: "enero", portada: "images/libro-default.jpg" },
    { id: 2, titulo: "Libro de ejemplo 2", autor: "Autor de ejemplo", paginas: 280, estado: "Leyendo", rating: 4, genero: "Fantasía", anio: 2026, mes: "febrero", portada: "images/libro-default.jpg" },
    { id: 3, titulo: "Libro de ejemplo 3", autor: "Autor de ejemplo", paginas: 420, estado: "Por leer", rating: 0, genero: "Misterio", anio: 2025, mes: "marzo", portada: "images/libro-default.jpg" }
];

let citas = JSON.parse(localStorage.getItem("citas")) || [];
let adaptaciones = JSON.parse(localStorage.getItem("adaptaciones")) || [];
let fechaTracker = new Date();
let anioSeleccionado = 2026;

function guardarEnLocalStorage() {
    localStorage.setItem("libros", JSON.stringify(libros));
    localStorage.setItem("citas", JSON.stringify(citas));
    localStorage.setItem("adaptaciones", JSON.stringify(adaptaciones));
}

function generarEstrellas(rating) {
    let estrellas = "";
    for (let i = 1; i <= 5; i++) {
        estrellas += i <= rating ? "★" : "☆";
    }
    return estrellas;
}

function normalizarClase(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
}

// --- CONTROL DE PESTAÑAS Y NAVEGACIÓN ---
function mostrarPagina(pagina) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if(btn.getAttribute('data-tab') === pagina) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const contenido = document.getElementById("contenido");

    if (pagina === "inicio") {
        contenido.innerHTML = `
            <h2>🏠 Bienvenida</h2>
            <p>Bienvenida a tu Book Journal. Selecciona una sección en las pestañas laterales para comenzar.</p>
        `;
    } else if (pagina === "libreria") {
        mostrarLibros();
    } else if (pagina === "estanterias") {
        contenido.innerHTML = `
            <h2>📖 Estanterías</h2>
            <p>Organiza tus lecturas por categorías y géneros.</p>
        `;
    } else if (pagina === "resenas") {
        contenido.innerHTML = `
            <h2>⭐ Reseñas</h2>
            <p>Consulta tus opiniones y valoraciones de los libros leídos.</p>
        `;
    } else if (pagina === "favorito") {
        mostrarFavoritosPorAnio();
    } else if (pagina === "tracker") {
        mostrarTracker();
    } else if (pagina === "citas") {
        mostrarCitas();
    } else if (pagina === "autores") {
        mostrarAutores();
    } else if (pagina === "registro") {
        mostrarRegistro();
    } else if (pagina === "adaptaciones") {
        mostrarAdaptaciones();
    } else if (pagina === "recap") {
        mostrarRecapPorAnio();
    }
}

// --- VISTA LIBRERÍA Y DETALLE AMPLIADO ---
function mostrarLibros() {
    const contenido = document.getElementById("contenido");
    let tarjetas = "";
    libros.forEach(libro => {
        tarjetas += `
            <div class="tarjeta-libro" onclick="mostrarLibro(${libro.id})">
                <img src="${libro.portada}" alt="${libro.titulo}">
                <h3>${libro.titulo}</h3>
                <p>${libro.autor}</p>
                <p class="estrellas">${generarEstrellas(libro.rating)}</p>
                <span class="badge ${normalizarClase(libro.estado)}">${libro.estado}</span>
            </div>
        `;
    });
    contenido.innerHTML = `
        <h2>📚 Mi Librería</h2>
        <div class="lista-libros">
            ${tarjetas}
        </div>
    `;
}

function mostrarLibro(id) {
    const libro = libros.find(libro => libro.id === id);
    if (!libro) return;
    const contenido = document.getElementById("contenido");

    contenido.innerHTML = `
        <button onclick="mostrarLibros()" class="boton-volver">
            ← Volver a librería
        </button>

        <div class="detalle-libro">
            <img src="${libro.portada}" alt="${libro.titulo}" class="portada-detalle">
            <div>
                <h2>${libro.titulo}</h2>
                <h3>${libro.autor}</h3>
                <p class="estrellas">${generarEstrellas(libro.rating)}</p>
                <p>📖 ${libro.paginas} páginas</p>
                <p>📚 ${libro.estado}</p>
                <p>🏷️ ${libro.genero}</p>
                <p>📅 Año: ${libro.anio || 2026}</p>
            </div>
        </div>

        <section class="seccion-libro">
            <h3>📝 Mi reseña</h3>
            <p>Aquí puedes consultar o escribir la reseña detallada de este libro.</p>
        </section>

        <section class="seccion-libro">
            <h3>💬 Citas favoritas del libro</h3>
            <p>Fragmentos memorables seleccionados de esta lectura.</p>
        </section>
    `;
}

// --- RECAP MENSUAL DIVIDIDO POR AÑOS Y MESES ---
function mostrarRecapPorAnio(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    let htmlMeses = "";
    meses.forEach(mes => {
        const librosMes = libros.filter(l => l.estado === "Leído" && (l.anio || 2026) === anioSeleccionado && (l.mes || "").toLowerCase() === mes);
        const cant = librosMes.length;
        const pags = librosMes.reduce((t, l) => t + l.paginas, 0);

        htmlMeses += `
            <div class="tarjeta-mes">
                <h4>${mes}</h4>
                <p>📚 Leídos: <strong>${cant}</strong></p>
                <p>📖 Páginas: <strong>${pags}</strong></p>
            </div>
        `;
    });

    contenido.innerHTML = `
        <h2>📊 Recap Mensual y Anual</h2>
        <div class="selector-anio">
            <button class="btn-anio ${anioSeleccionado === 2026 ? 'activo' : ''}" onclick="mostrarRecapPorAnio(2026)">2026</button>
            <button class="btn-anio ${anioSeleccionado === 2025 ? 'activo' : ''}" onclick="mostrarRecapPorAnio(2025)">2025</button>
        </div>
        <div class="grilla-meses">
            ${htmlMeses}
        </div>
    `;
}

// --- FAVORITO DEL MES DIVIDIDO POR AÑOS ---
function mostrarFavoritosPorAnio(anio = 2026) {
    anioSeleccionado = anio;
    const contenido = document.getElementById("contenido");
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    let htmlFavoritos = "";
    meses.forEach(mes => {
        // Buscamos un libro favorito o el mejor calificado de ese mes/año
        const fav = libros.find(l => (l.anio || 2026) === anioSeleccionado && (l.mes || "").toLowerCase() === mes && l.rating === 5) || 
                    libros.find(l => (l.anio || 2026) === anioSeleccionado && (l.mes || "").toLowerCase() === mes);

        htmlFavoritos += `
            <div class="tarjeta-mes">
                <h4>${mes}</h4>
                ${fav ? `<p style="font-size:13px; font-weight:bold; margin-top:5px;">${fav.titulo}</p><small>${fav.autor}</small>` : `<p style="font-size:12px; color:#999; margin-top:5px;">Sin asignar</p>`}
            </div>
        `;
    });

    contenido.innerHTML = `
        <h2>💚 Favorito del Mes (${anioSeleccionado})</h2>
        <div class="selector-anio">
            <button class="btn-anio ${anioSeleccionado === 2026 ? 'activo' : ''}" onclick="mostrarFavoritosPorAnio(2026)">2026</button>
            <button class="btn-anio ${anioSeleccionado === 2025 ? 'activo' : ''}" onclick="mostrarFavoritosPorAnio(2025)">2025</button>
        </div>
        <div class="grilla-meses">
            ${htmlFavoritos}
        </div>
    `;
}

// --- FORMULARIO DE REGISTRO ---
function mostrarRegistro() {
    const contenido = document.getElementById("contenido");
    contenido.innerHTML = `
        <h2>📝 Registrar libro</h2>
        <form id="formulario-libro" class="formulario-libro">
            <label>Título</label>
            <input type="text" id="titulo" required>
            <label>Autor</label>
            <input type="text" id="autor" required>
            <label>Páginas</label>
            <input type="number" id="paginas" min="1">
            <label>Género</label>
            <input type="text" id="genero">
            <label>Año de lectura</label>
            <input type="number" id="anio" value="2026">
            <label>Mes de lectura</label>
            <select id="mes">
                <option value="enero">Enero</option><option value="febrero">Febrero</option><option value="marzo">Marzo</option>
                <option value="abril">Abril</option><option value="mayo">Mayo</option><option value="junio">Junio</option>
                <option value="julio">Julio</option><option value="agosto">Agosto</option><option value="septiembre">Septiembre</option>
                <option value="octubre">Octubre</option><option value="noviembre">Noviembre</option><option value="diciembre">Diciembre</option>
            </select>
            <label>Estado</label>
            <select id="estado">
                <option value="Por leer">Por leer</option><option value="Leyendo">Leyendo</option>
                <option value="Leído">Leído</option><option value="Pausado">Pausado</option><option value="Abandonado">Abandonado</option>
            </select>
            <label>Calificación</label>
            <select id="rating">
                <option value="0">Sin calificar</option><option value="1">★</option><option value="2">★★</option>
                <option value="3">★★★</option><option value="4">★★★★</option><option value="5">★★★★★</option>
            </select>
            <button type="submit">Guardar libro</button>
        </form>
    `;
    document.getElementById("formulario-libro").addEventListener("submit", guardarLibro);
}

function guardarLibro(event) {
    event.preventDefault();
    const nuevoLibro = {
        id: Date.now(),
        titulo: document.getElementById("titulo").value,
        autor: document.getElementById("autor").value,
        paginas: Number(document.getElementById("paginas").value),
        genero: document.getElementById("genero").value,
        anio: Number(document.getElementById("anio").value),
        mes: document.getElementById("mes").value,
        estado: document.getElementById("estado").value,
        rating: Number(document.getElementById("rating").value),
        portada: "images/libro-default.jpg"
    };
    libros.push(nuevoLibro);
    guardarEnLocalStorage();
    alert("Libro agregado correctamente");
    mostrarLibros();
}

// --- CITAS ---
function mostrarCitas() {
    const contenido = document.getElementById("contenido");
    let htmlCitas = "";
    if (citas.length === 0) {
        htmlCitas = `<p style="text-align:center; margin-top:20px;">Todavía no tienes citas guardadas.</p>`;
    } else {
        citas.forEach(cita => {
            htmlCitas += `
                <div style="background:#f9f9f9; padding:15px; border-radius:10px; margin-bottom:12px; border-left:4px solid #a2d2d6;">
                    <blockquote style="font-style:italic; margin-bottom:8px;">"${cita.texto}"</blockquote>
                    <p style="font-size:13px; color:#666;">📖 ${cita.libro} ${cita.autor ? '— ✍️ ' + cita.autor : ''}</p>
                </div>
            `;
        });
    }
    contenido.innerHTML = `
        <h2>💬 Mis citas</h2>
        <div style="text-align:center; margin-bottom:20px;">
            <button onclick="mostrarFormularioCita()" style="background:#a2d2d6; border:none; padding:10px 15px; border-radius:8px; font-weight:bold; cursor:pointer;">+ Nueva cita</button>
        </div>
        <div>${htmlCitas}</div>
    `;
}

function mostrarFormularioCita() {
    const contenido = document.getElementById("contenido");
    contenido.innerHTML = `
        <h2>💬 Nueva cita</h2>
        <form id="form-cita" class="formulario-libro">
            <label>Cita</label>
            <textarea id="texto-cita" required></textarea>
            <label>Libro</label>
            <input type="text" id="libro-cita" required>
            <label>Autor</label>
            <input type="text" id="autor-cita">
            <label>Página</label>
            <input type="number" id="pagina-cita">
            <button type="submit">Guardar cita</button>
        </form>
    `;
    document.getElementById("form-cita").addEventListener("submit", guardarCita);
}

function guardarCita(event) {
    event.preventDefault();
    const cita = {
        texto: document.getElementById("texto-cita").value,
        libro: document.getElementById("libro-cita").value,
        autor: document.getElementById("autor-cita").value,
        pagina: document.getElementById("pagina-cita").value
    };
    citas.push(cita);
    guardarEnLocalStorage();
    mostrarCitas();
}

// --- TRACKER ---
function mostrarTracker() {
    const contenido = document.getElementById("contenido");
    contenido.innerHTML = `
        <div class="tracker">
            <h2>📅 Reading Tracker</h2>
            <div class="tracker-controles">
                <button onclick="cambiarMes(-1)">←</button>
                <h3 id="mes-actual"></h3>
                <button onclick="cambiarMes(1)">→</button>
            </div>
            <div id="calendario" class="calendario"></div>
        </div>
    `;
    generarCalendario();
}

function generarCalendario() {
    const calendario = document.getElementById("calendario");
    const tituloMes = document.getElementById("mes-actual");
    const año = fechaTracker.getFullYear();
    const mes = fechaTracker.getMonth();
    tituloMes.textContent = fechaTracker.toLocaleDateString("es-MX", { month: "long", year: "numeric" }).toUpperCase();
    
    const primerDia = new Date(año, mes, 1).getDay();
    const diasMes = new Date(año, mes + 1, 0).getDate();
    
    let html = `
        <div class="dia-semana">L</div><div class="dia-semana">M</div><div class="dia-semana">M</div>
        <div class="dia-semana">J</div><div class="dia-semana">V</div><div class="dia-semana">S</div><div class="dia-semana">D</div>
    `;
    let inicio = primerDia === 0 ? 6 : primerDia - 1;
    for (let i = 0; i < inicio; i++) { html += `<div class="dia" style="background:transparent; border:none;"></div>`; }
    for (let dia = 1; dia <= diasMes; dia++) {
        html += `<button class="dia" onclick="alert('Día ${dia}')">${dia}</button>`;
    }
    calendario.innerHTML = html;
}

function cambiarMes(valor) {
    fechaTracker.setMonth(fechaTracker.getMonth() + valor);
    generarCalendario();
}

// --- AUTORES Y ADAPTACIONES ---
function mostrarAutores() {
    document.getElementById("contenido").innerHTML = `
        <h2>👩 Autores</h2>
        <p style="text-align:center;">Directorio de tus escritores favoritos.</p>
    `;
}

function mostrarAdaptaciones() {
    document.getElementById("contenido").innerHTML = `
        <h2>🎬 Adaptaciones</h2>
        <p style="text-align:center;">Películas y series basadas en tus lecturas.</p>
    `;
}