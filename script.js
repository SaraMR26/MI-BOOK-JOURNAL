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

}
function mostrarLibros() {

    const contenido =
        document.getElementById("contenido");


    let tarjetas = "";


    libros.forEach(libro => {

        tarjetas += `

            <div class="tarjeta-libro">

                <img
                    src="${libro.portada}"
                    alt="${libro.titulo}"
                    class="portada-libro"
                >

                <div class="informacion-libro">

                    <h3>
                        ${libro.titulo}
                    </h3>

                    <p>
                        ${libro.autor}
                    </p>

                    <p class="estrellas">

                        ${generarEstrellas(libro.rating)}

                    </p>

                    <p>
                        ${libro.estado}
                    </p>

                </div>

            </div>

        `;

    });


    contenido.innerHTML = `

        <h2>📚 Mi Librería</h2>

        <div class="biblioteca">

            ${tarjetas}

        </div>

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