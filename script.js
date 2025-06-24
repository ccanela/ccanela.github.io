document.addEventListener('DOMContentLoaded', function() {
    // --- 1. NEW NAVIGATION LOGIC FOR MULTI-PAGE SITE ---
    // This function highlights the active link in the navigation bar.
    function updateActiveNavLink() {
        const navLinks = document.querySelectorAll('nav a.nav-link');
        const mobileNavLinks = document.querySelectorAll('#mobile-menu a');
        const currentPage = window.location.pathname.split('/').pop(); // Gets 'entrevistes.html', 'index.html', etc.

        const setActive = (links) => {
            links.forEach(link => {
                const linkPage = link.getAttribute('href');
                // Special case for home page (index.html or '/')
                if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        };

        setActive(navLinks);
        setActive(mobileNavLinks);
    }

    updateActiveNavLink(); // Run the function on every page load.

    // --- 2. ALL OTHER FUNCTIONALITY REMAINS (but will only run on the relevant pages) ---

    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    // Menú mòbil (works on all pages)
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Botons de descarregar (only on 'guia.html', will be ignored on other pages)
    const downloadStudent = document.getElementById('download-student');
    if (downloadStudent) {
        downloadStudent.addEventListener('click', function() {
            alert("Aquesta és una versió de mostra. El Quadern de l'alumne estaria disponible per a descarregar aquí.");
        });
    }

    const downloadTeacher = document.getElementById('download-teacher');
    if (downloadTeacher) {
        downloadTeacher.addEventListener('click', function() {
            alert("Aquesta és una versió de mostra. Les Orientacions didàctiques estarien disponibles per a descarregar aquí.");
        });
    }


    // --- FUNCIONALITATS D'ACTIVITATS INTERACTIVES (Only on 'activitats.html') ---
    // The code will only execute if the elements are found on the current page.

    const storyCards = document.querySelectorAll(".story-card");
    const levelSelection = document.getElementById("level-selection");
    const storySelection = document.querySelector(".grid.grid-cols-1.md\\:grid-cols-3.lg\\:grid-cols-4");
    const selectedTitle = document.getElementById("selected-story-title");
    const selectedDesc = document.getElementById("selected-story-desc");
    const backToStoriesBtn = document.getElementById("back-to-stories");

    if (storyCards.length > 0) {
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

        backToStoriesBtn.addEventListener("click", () => {
            storySelection.classList.remove("hidden");
            levelSelection.classList.add("hidden");
        });
    }


    const levelButtons = document.querySelectorAll(".level-btn");
    const activityContainer = document.getElementById("activity-container");
    const backToLevelsBtn = document.getElementById("back-to-levels");

    if (levelButtons.length > 0) {
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

        backToLevelsBtn.addEventListener("click", () => {
            activityContainer.classList.add("hidden");
            levelSelection.classList.remove("hidden");
        });
    }


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

    document.getElementById("check-reading-nouvinguda")?.addEventListener("click", () => checkQuiz("nouvinguda-principiant"));
    document.getElementById("check-comprensio-nouvinguda")?.addEventListener("click", () => checkQuiz("nouvinguda-mitja"));

    // Comprovar inputs de text
    document.getElementById("check-writing-nouvinguda")?.addEventListener("click", () => {
        const inputs = document.querySelectorAll('#nouvinguda-principiant input[type="text"]');
        inputs.forEach(input => {
            input.classList.remove("border-green-500", "border-red-500");
            const expected = input.dataset.answer?.toLowerCase().trim();
            const value = input.value.toLowerCase().trim();
            input.classList.add(value === expected ? "border-green-500" : "border-red-500");
        });
    });

    // Comprovar vocabulari amb drag & drop
    document.getElementById("check-vocab-nouvinguda")?.addEventListener("click", () => {
        const zones = document.querySelectorAll('#nouvinguda-principiant .drop-zone');
        zones.forEach(zone => {
            const word = zone.querySelector('.drag-item')?.dataset.word;
            const correct = zone.dataset.definition;
            zone.classList.remove("bg-green-100", "bg-red-100");
            zone.classList.add(word === correct ? "bg-green-100" : "bg-red-100");
        });
    });

    document.getElementById("check-grammar-nouvinguda")?.addEventListener("click", () => {
        const zones = document.querySelectorAll('#nouvinguda-mitja .drop-zone');
        zones.forEach(zone => {
            const items = zone.querySelectorAll('.drag-item');
            const expected = zone.dataset.type;
            items.forEach(item => {
                item.classList.remove("bg-green-100", "bg-red-100");
                item.classList.add(item.dataset.type === expected ? "bg-green-100" : "bg-red-100");
            });
        });
    });

    // Drag & drop funcionalitat
    const dragItems = document.querySelectorAll('.drag-item');
    if (dragItems.length > 0) {
        dragItems.forEach(item => {
            item.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', item.outerHTML);
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => item.classList.add('hidden'), 0);
            });
            item.addEventListener('dragend', () => item.classList.remove('hidden'));
        });

        const dropZones = document.querySelectorAll('.drop-zone');
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', e => {
                e.preventDefault();
                zone.classList.add('border-accent');
            });
            zone.addEventListener('dragleave', () => zone.classList.remove('border-accent'));
            zone.addEventListener('drop', e => {
                e.preventDefault();
                const data = e.dataTransfer.getData('text/plain');
                zone.classList.remove('border-accent');
                zone.innerHTML = data;

                const newItem = zone.querySelector('.drag-item');
                if (newItem) {
                    newItem.addEventListener('dragstart', e => {
                        e.dataTransfer.setData('text/plain', newItem.outerHTML);
                        e.dataTransfer.effectAllowed = 'move';
                        setTimeout(() => newItem.classList.add('hidden'), 0);
                    });
                    newItem.addEventListener('dragend', () => newItem.classList.remove('hidden'));
                }
            });
        });
    }

    // --- SWIPER CAROUSEL (Only on 'entrevistes.html') ---
    function initSwiper(selector) {
        // Check if Swiper and the selector element exist before initializing
        if (typeof Swiper !== 'undefined' && document.querySelector(selector)) {
            return new Swiper(selector, {
                loop: true,
                grabCursor: true,
                autoplay: { delay: 5000, disableOnInteraction: false },
                slidesPerView: 1,
                spaceBetween: 20,
                breakpoints: {
                    768: { slidesPerView: 2, spaceBetween: 20 },
                    1024: { slidesPerView: 3, spaceBetween: 30 }
                },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            });
        }
    }

    initSwiper('.swiper-radio');
    initSwiper('.swiper-tv');
});

