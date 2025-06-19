document.addEventListener('DOMContentLoaded', function() {
        const navLinks = document.querySelectorAll('[data-page]');
        const pages = document.querySelectorAll('.page');
        const menuToggle = document.getElementById('menu-toggle');
        const mobileMenu = document.getElementById('mobile-menu');
        const downloadStudent = document.getElementById('download-student');
        const downloadTeacher = document.getElementById('download-teacher');

        // Funció per canviar de pàgina
        function navigateTo(pageId) {
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(pageId)?.classList.add('active');

            navLinks.forEach(link => {
                if (link.getAttribute('data-page') === pageId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });

            if (mobileMenu) mobileMenu.classList.add('hidden');

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Navegació per clic
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const pageId = this.getAttribute('data-page');
                navigateTo(pageId);
                window.location.hash = pageId;
            });
        });

        // Navegació si hi ha hash a la URL
        const initialHash = window.location.hash.replace('#', '');
        const validPage = Array.from(pages).some(page => page.id === initialHash);
        if (initialHash && validPage) {
            navigateTo(initialHash);
        } else {
            navigateTo('home'); // Per defecte, mostra "Inici"
        }

        // Menú mòbil
        if (menuToggle && mobileMenu) {
            menuToggle.addEventListener('click', function() {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Descarregar arxius
        if (downloadStudent) {
            downloadStudent.addEventListener('click', function() {
                alert("Aquesta és una versió de mostra. El Quadern de l'alumne estaria disponible per a descarregar aquí.");
            });
        }

        if (downloadTeacher) {
            downloadTeacher.addEventListener('click', function() {
                alert("Aquesta és una versió de mostra. Les Orientacions didàctiques estarien disponibles per a descarregar aquí.");
            });
        }
    });
