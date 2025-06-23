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
        navigateTo('home'); // Per defecte
    }

    // Menú mòbil
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Botons de descarregar
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

    // FUNCIONALITATS D'ACTIVITATS INTERACTIVES

    const storyCards = document.querySelectorAll(".story-card");
    const levelSelection = document.getElementById("level-selection");
    const storySelection = document.querySelector(".grid.grid-cols-1.md\\:grid-cols-3.lg\\:grid-cols-4");
    const selectedTitle = document.getElementById("selected-story-title");
    const selectedDesc = document.getElementById("selected-story-desc");

    storyCards.forEach(card => {
        card.addEventListener("click", () => {
            const title = card.querySelector("h3").innerText;
            const desc = card.querySelector("p").innerText;
            selectedTitle.textContent = title;
            selectedDesc.textContent = desc;

            storySelection.classList.add("hidden");
            levelSelection.classList.remove("hidden");
            levelSelection.dataset.story = card.dataset.story;
        });
    });

    document.getElementById("back-to-stories").addEventListener("click", () => {
        storySelection.classList.remove("hidden");
        levelSelection.classList.add("hidden");
    });

    const levelButtons = document.querySelectorAll(".level-btn");
    const activityContainer = document.getElementById("activity-container");

    levelButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const level = btn.dataset.level;
            const story = levelSelection.dataset.story;

            levelSelection.classList.add("hidden");
            activityContainer.classList.remove("hidden");

            document.querySelectorAll(".activity-container").forEach(ac => ac.classList.add("hidden"));

            const target = document.getElementById(`${story}-${level}`);
            if (target) target.classList.remove("hidden");

            document.getElementById("activity-story-title").textContent = selectedTitle.textContent;
            document.getElementById("activity-level").textContent = level.charAt(0).toUpperCase() + level.slice(1);
        });
    });

    document.getElementById("back-to-levels").addEventListener("click", () => {
        activityContainer.classList.add("hidden");
        levelSelection.classList.remove("hidden");
    });

    // Interacció de seleccionables en qüestionaris
    document.querySelectorAll(".quiz-option").forEach(opt => {
        opt.addEventListener("click", () => {
            const parent = opt.parentElement;
            if (parent.classList.contains("space-y-2")) {
                parent.querySelectorAll(".quiz-option").forEach(el => el.classList.remove("selected"));
            }
            opt.classList.toggle("selected");
        });
    });

    // Comprovar comprensió lectora
    function checkQuiz(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const options = container.querySelectorAll(".quiz-option");

        options.forEach(opt => {
            opt.classList.remove("bg-green-200", "bg-red-200");
            const isCorrect = opt.dataset.correct === "true";
            if (opt.classList.contains("selected")) {
                opt.classList.add(isCorrect ? "bg-green-200" : "bg-red-200");
            } else if (isCorrect) {
                opt.classList.add("bg-green-100");
            }
        });
    }

    document.getElementById("check-reading-nouvinguda")?.addEventListener("click", () => {
        checkQuiz("nouvinguda-principiant");
    });

    document.getElementById("check-comprensio-nouvinguda")?.addEventListener("click", () => {
        checkQuiz("nouvinguda-mitja");
    });

    // Comprovar inputs de text
    document.getElementById("check-writing-nouvinguda")?.addEventListener("click", () => {
        const inputs = document.querySelectorAll('#nouvinguda-principiant input[type="text"]');
        inputs.forEach(input => {
            input.classList.remove("border-green-500", "border-red-500");
            const expected = input.dataset.answer?.toLowerCase().trim();
            const value = input.value.toLowerCase().trim();
            if (value === expected) {
                input.classList.add("border-green-500");
            } else {
                input.classList.add("border-red-500");
            }
        });
    });

    // Comprovar vocabulari amb drag & drop
    document.getElementById("check-vocab-nouvinguda")?.addEventListener("click", () => {
        const zones = document.querySelectorAll('#nouvinguda-principiant .drop-zone');
        zones.forEach(zone => {
            const word = zone.querySelector('.drag-item')?.dataset.word;
            const correct = zone.dataset.definition;
            zone.classList.remove("bg-green-100", "bg-red-100");

            if (word === correct) {
                zone.classList.add("bg-green-100");
            } else {
                zone.classList.add("bg-red-100");
            }
        });
    });

    document.getElementById("check-grammar-nouvinguda")?.addEventListener("click", () => {
        const zones = document.querySelectorAll('#nouvinguda-mitja .drop-zone');
        zones.forEach(zone => {
            const items = zone.querySelectorAll('.drag-item');
            const expected = zone.dataset.type;
            items.forEach(item => {
                item.classList.remove("bg-green-100", "bg-red-100");
                if (item.dataset.type === expected) {
                    item.classList.add("bg-green-100");
                } else {
                    item.classList.add("bg-red-100");
                }
            });
        });
    });

    // Drag & drop funcionalitat
    const dragItems = document.querySelectorAll('.drag-item');
    dragItems.forEach(item => {
        item.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', item.outerHTML);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => item.classList.add('hidden'), 0);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('hidden');
        });
    });

    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('border-accent');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('border-accent');
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text/plain');
            zone.innerHTML = data;
            zone.classList.remove('border-accent');

            // Reassignar events després del drop
            const newItem = zone.querySelector('.drag-item');
            if (newItem) {
                newItem.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('text/plain', newItem.outerHTML);
                    e.dataTransfer.effectAllowed = 'move';
                    setTimeout(() => newItem.classList.add('hidden'), 0);
                });
                newItem.addEventListener('dragend', () => {
                    newItem.classList.remove('hidden');
                });
            }
        });
    });
});
