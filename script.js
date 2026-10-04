const libros = [

    {
        id: 1,
        titulo: "Libro de ejemplo 1",
        autor: "Autor de ejemplo",
        paginas: 350,
        estado: "Leído",
        rating: 5,
        genero: "Romance",
        
    },

    {
        id: 2,
        titulo: "Libro de ejemplo 2",
        autor: "Autor de ejemplo",
        paginas: 280,
        estado: "Leyendo",
        rating: 4,
        genero: "Fantasía",
        
    },

    {
        id: 3,
        titulo: "Libro de ejemplo 3",
        autor: "Autor de ejemplo",
        paginas: 420,
        estado: "Por leer",
        rating: 0,
        genero: "Misterio",
       
    }

];
function generarEstrellas(rating) {

    let estrellas = "";

    for (let i = 1; i <= 5; i++) {

        if (i <= rating) {

            estrellas += "★";

        } else {

            estrellas += "☆";

        }

    }

    return estrellas;

function mostrarLibro(id) {

    const libro =
        libros.find(libro => libro.id === id);


    const contenido =
        document.getElementById("contenido");


    contenido.innerHTML = `

        <button
            onclick="mostrarLibros()"
            class="boton-volver"
        >
            ← Volver
        </button>


        <div class="detalle-libro">

            <img
                src="${libro.portada}"
                alt="${libro.titulo}"
                class="portada-detalle"
            >


            <div>

                <h2>
                    ${libro.titulo}
                </h2>

                <h3>
                    ${libro.autor}
                </h3>

                <p class="estrellas">
                    ${generarEstrellas(libro.rating)}
                </p>

                <p>
                    📖 ${libro.paginas} páginas
                </p>

                <p>
                    📚 ${libro.estado}
                </p>

                <p>
                    🏷️ ${libro.genero}
                </p>

            </div>

        </div>


        <section class="seccion-libro">

            <h3>📝 Mi reseña</h3>

            <p>
                Aquí escribiremos la reseña.
            </p>

        </section>


        <section class="seccion-libro">

            <h3>💬 Citas favoritas</h3>

            <p>
                Aquí aparecerán las citas.
            </p>

        </section>

    `;

}

function mostrarPagina(pagina) {

    const contenido =
        document.getElementById("contenido");


    if (pagina === "inicio") {

        contenido.innerHTML = `

            <h2>🏠 Bienvenida</h2>

            <p>
                Bienvenida a tu Book Journal.
            </p>

        `;

    }


    else if (pagina === "libreria") {

        contenido.innerHTML = `

            <h2>📚 Mi Librería</h2>

            <p>
                Aquí aparecerán tus libros.
            </p>

        `;

    }


    else if (pagina === "estanterias") {

        contenido.innerHTML = `

            <h2>📖 Estanterías</h2>

            <p>
                Aquí estarán tus categorías.
            </p>

        `;

    }


    else if (pagina === "resenas") {

        contenido.innerHTML = `

            <h2>⭐ Reseñas</h2>

            <p>
                Aquí aparecerán tus reseñas.
            </p>

        `;

    }


    else if (pagina === "favorito") {

        contenido.innerHTML = `

            <h2>💚 Favorito del mes</h2>

            <p>
                Aquí aparecerá tu favorito.
            </p>

        `;

    }


    else if (pagina === "tracker") {

        contenido.innerHTML = `

            <h2>📅 Reading Tracker</h2>

            <p>
                Aquí llevarás tu seguimiento.
            </p>

        `;

    }


    else if (pagina === "citas") {

        contenido.innerHTML = `

            <h2>💬 Citas</h2>

            <p>
                Aquí guardarás tus citas favoritas.
            </p>

        `;

    }


    else if (pagina === "autores") {

        contenido.innerHTML = `

            <h2>👩 Autores</h2>

            <p>
                Aquí estarán tus autores.
            </p>

        `;

    }


    else if (pagina === "registro") {

        contenido.innerHTML = `

            <h2>📝 Registro de libros</h2>

            <p>
                Aquí podrás registrar libros.
            </p>

        `;

    }


    else if (pagina === "adaptaciones") {

        contenido.innerHTML = `

            <h2>🎬 Adaptaciones</h2>

            <p>
                Aquí estarán las adaptaciones.
            </p>

        `;

    }


    else if (pagina === "recap") {

        contenido.innerHTML = `

            <h2>📊 Recap mensual</h2>

            <p>
                Aquí estarán tus estadísticas.
            </p>

        `;

    }

}
function mostrarRegistro() {

    const contenido =
        document.getElementById("contenido");


    contenido.innerHTML = `

        <h2>📝 Registrar libro</h2>


        <form
            id="formulario-libro"
            class="formulario-libro"
        >

            <label>
                Título
            </label>

            <input
                type="text"
                id="titulo"
                required
            >


            <label>
                Autor
            </label>

            <input
                type="text"
                id="autor"
                required
            >


            <label>
                Páginas
            </label>

            <input
                type="number"
                id="paginas"
                min="1"
            >


            <label>
                Género
            </label>

            <input
                type="text"
                id="genero"
            >


            <label>
                Estado
            </label>

            <select id="estado">

                <option value="Por leer">
                    Por leer
                </option>

                <option value="Leyendo">
                    Leyendo
                </option>

                <option value="Leído">
                    Leído
                </option>

                <option value="Pausado">
                    Pausado
                </option>

                <option value="Abandonado">
                    Abandonado
                </option>

            </select>


            <label>
                Calificación
            </label>

            <select id="rating">

                <option value="0">Sin calificar</option>

                <option value="1">★</option>

                <option value="2">★★</option>

                <option value="3">★★★</option>

                <option value="4">★★★★</option>

                <option value="5">★★★★★</option>

            </select>


            <button type="submit">

                Guardar libro

            </button>

        </form>

    `;


    document
        .getElementById("formulario-libro")
        .addEventListener(
            "submit",
            guardarLibro
        );

}
function guardarLibro(event) {

    event.preventDefault();


    const nuevoLibro = {

        id: Date.now(),

        titulo:
            document.getElementById("titulo").value,

        autor:
            document.getElementById("autor").value,

        paginas:
            Number(
                document.getElementById("paginas").value
            ),

        genero:
            document.getElementById("genero").value,

        estado:
            document.getElementById("estado").value,

        rating:
            Number(
                document.getElementById("rating").value
            ),

        portada:
            "images/libro-default.jpg"

    };


    libros.push(nuevoLibro);


    alert("Libro agregado correctamente");


    mostrarLibros();

}