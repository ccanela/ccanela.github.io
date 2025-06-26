document.addEventListener('DOMContentLoaded', function() {

    // --- GLOBAL FUNCTIONALITY (Runs on all pages) ---

    // 1. Active Navigation Link Highlighting
    function updateActiveNavLink() {
        const navLinks = document.querySelectorAll('header nav a.nav-link');
        const mobileNavLinks = document.querySelectorAll('#mobile-menu a');
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        const setActive = (links) => {
            links.forEach(link => {
                const linkPage = link.getAttribute('href');
                if (linkPage === currentPage) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        };

        setActive(navLinks);
        setActive(mobileNavLinks);
    }
    updateActiveNavLink(); // Run on every page load.

    // 2. Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }


    // --- PAGE-SPECIFIC FUNCTIONALITY ---

    // A. GUIA.HTML SPECIFIC: Download Buttons
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

    // B. ENTREVISTES.HTML SPECIFIC: Swiper Carousel
    function initSwiper(selector) {
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


    // C. ACTIVITATS.HTML SPECIFIC: Interactive Activities
    // This 'if' block ensures the following code only runs on activitats.html
    const storySelectionContainer = document.getElementById('story-selection');
    if (storySelectionContainer) {
        
        // --- State Object ---
        let activityState = {
            userName: '',
            selectedStory: '',
            selectedStoryTitle: '',
            selectedLevel: '',
            currentStepIndex: 0,
            totalSteps: 0,
            activityResults: [] // Stores {title, userAnswer, isCorrect}
        };

        // --- DOM Elements ---
        const levelSelectionContainer = document.getElementById('level-selection');
        const activityContainer = document.getElementById('activity-container');
        const nameInputContainer = document.getElementById('name-input-container');
        const studentNameInput = document.getElementById('student-name');
        const startActivitiesBtn = document.getElementById('start-activities-btn');
        const mainActivityContent = document.getElementById('main-activity-content');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const storyCards = document.querySelectorAll('.story-card');
        const levelBtns = document.querySelectorAll('.level-btn');
        const backToStoriesBtn = document.getElementById('back-to-stories');
        const backToLevelsBtn = document.getElementById('back-to-levels');
        const noActivitiesPlaceholder = document.getElementById('no-activities-placeholder');


        // --- Main Navigation Flow ---
        function showStoriesView() {
            levelSelectionContainer.classList.add('hidden');
            activityContainer.classList.add('hidden');
            storySelectionContainer.classList.remove('hidden');
            storyCards.forEach(c => c.classList.remove('active'));
        }

        function showLevelsView(storyCard) {
            activityState.selectedStory = storyCard.dataset.story;
            activityState.selectedStoryTitle = storyCard.querySelector('h3').textContent;
            const desc = storyCard.querySelector('p').textContent;

            storyCards.forEach(c => c.classList.remove('active'));
            storyCard.classList.add('active');

            document.getElementById('selected-story-title').textContent = activityState.selectedStoryTitle;
            document.getElementById('selected-story-desc').textContent = desc.trim();
            
            activityContainer.classList.add('hidden');
            storySelectionContainer.classList.add('hidden');
            levelSelectionContainer.classList.remove('hidden');
            levelBtns.forEach(b => b.classList.remove('active'));
        }

        function showActivitiesView(levelBtn) {
            activityState.selectedLevel = levelBtn.dataset.level;
            levelBtns.forEach(b => b.classList.remove('active'));
            levelBtn.classList.add('active');

            document.getElementById('activity-story-title').textContent = activityState.selectedStoryTitle;
            document.getElementById('activity-level').textContent = `Nivell: ${activityState.selectedLevel.charAt(0).toUpperCase() + activityState.selectedLevel.slice(1)}`;

            levelSelectionContainer.classList.add('hidden');
            activityContainer.classList.remove('hidden');
            
            mainActivityContent.classList.add('hidden');
            nameInputContainer.classList.remove('hidden');
            studentNameInput.value = '';
            startActivitiesBtn.disabled = true;
        }

        // --- Activity Initialization and Control ---
        function initializeActivitySet(activitySet) {
            activityState.currentStepIndex = 0;
            activityState.activityResults = [];
            const steps = activitySet.querySelectorAll('.activity-step');
            activityState.totalSteps = steps.length;
            
            steps.forEach((step, index) => {
                step.classList.toggle('hidden', index !== 0);
                step.querySelector('.check-btn').disabled = false;
                step.querySelector('.skip-btn').classList.add('hidden');
                step.querySelector('.feedback-msg').textContent = '';
                
                // Reset specific activity types
                if (step.querySelector('.quiz-options')) initializeQuiz(step);
                if (step.querySelector('.drop-zone')) initializeDragAndDrop(step);
            });

            activitySet.querySelector('#completion-message')?.classList.add('hidden');
            updateProgressBar();
            
            if (!activitySet.hasAttribute('data-listeners-attached')) {
                steps.forEach(step => {
                    step.querySelector('.check-btn')?.addEventListener('click', () => handleCheck(step));
                    step.querySelector('.skip-btn')?.addEventListener('click', () => handleSkip(step));
                });
                activitySet.querySelector('#restart-level')?.addEventListener('click', () => showActivitiesView(document.querySelector(`.level-btn.active`)));
                activitySet.querySelector('#download-pdf-btn')?.addEventListener('click', generatePDF);
                activitySet.setAttribute('data-listeners-attached', 'true');
            }
        }
        
        function updateProgressBar() {
            const progress = (activityState.currentStepIndex / activityState.totalSteps) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `Pas ${activityState.currentStepIndex} / ${activityState.totalSteps}`;
        }
        
        function goToNextStep() {
            const activitySet = document.querySelector('.activity-set:not(.hidden)');
            if (!activitySet) return;
            const steps = activitySet.querySelectorAll('.activity-step');
            
            steps[activityState.currentStepIndex].classList.add('hidden');
            activityState.currentStepIndex++;
            updateProgressBar();

            if (activityState.currentStepIndex < activityState.totalSteps) {
                steps[activityState.currentStepIndex].classList.remove('hidden');
            } else {
                progressText.textContent = `Completat!`;
                activitySet.querySelector('#completion-message')?.classList.remove('hidden');
            }
        }

        function handleCheck(currentStep) {
            let isCorrect = false;
            let userAnswer = '';
            
            if (currentStep.querySelector('.quiz-options')) {
                const result = checkQuiz(currentStep);
                isCorrect = result.correct;
                userAnswer = result.answer;
            }
            if (currentStep.querySelector('.drop-zone')) {
                const result = checkDragAndDrop(currentStep);
                isCorrect = result.correct;
                userAnswer = result.answer;
            }

            saveResult(currentStep, userAnswer, isCorrect);
            const feedbackMsg = currentStep.querySelector('.feedback-msg');
            
            if (isCorrect) {
                feedbackMsg.textContent = 'Molt bé! Resposta correcta.';
                feedbackMsg.classList.add('text-green-600');
                feedbackMsg.classList.remove('text-red-600');
                currentStep.querySelector('.check-btn').disabled = true;
                currentStep.querySelector('.skip-btn').classList.add('hidden');
                setTimeout(goToNextStep, 1500);
            } else {
                feedbackMsg.textContent = 'Hi ha alguns errors. Torna a intentar-ho o salta l\'activitat.';
                feedbackMsg.classList.add('text-red-600');
                feedbackMsg.classList.remove('text-green-600');
                currentStep.querySelector('.skip-btn').classList.remove('hidden');
            }
        }

        function handleSkip(currentStep) {
             saveResult(currentStep, 'Saltat', false);
             goToNextStep();
        }

        function saveResult(step, answer, isCorrect) {
            const title = step.dataset.stepTitle || `Activitat ${activityState.currentStepIndex + 1}`;
            const existingIndex = activityState.activityResults.findIndex(r => r.title === title);
            const result = { title, userAnswer: answer, isCorrect };
            if (existingIndex > -1) {
                activityState.activityResults[existingIndex] = result;
            } else {
                activityState.activityResults.push(result);
            }
        }

        // --- Activity-specific Logic (Initializers and Checkers) ---

        function initializeDragAndDrop(container) {
            const draggables = container.querySelectorAll('.drag-item, .drag-item-vocab');
            draggables.forEach(item => {
                const originalParent = item.closest('.activity-step').querySelector(`#words-${item.classList.contains('drag-item') ? '1' : '2'}`);
                if (originalParent) originalParent.appendChild(item); // Reset position
                item.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', item.dataset.word);
                    setTimeout(() => item.classList.add('opacity-50'), 0);
                });
                item.addEventListener('dragend', () => item.classList.remove('opacity-50'));
            });
            const dropZones = container.querySelectorAll('.drop-zone, .drop-zone-vocab');
            dropZones.forEach(zone => {
                zone.innerHTML = '';
                zone.classList.remove('correct-drop', 'incorrect-drop', 'highlight');
                zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('highlight'); });
                zone.addEventListener('dragleave', () => zone.classList.remove('highlight'));
                zone.addEventListener('drop', e => {
                    e.preventDefault();
                    zone.classList.remove('highlight');
                    const draggedWord = e.dataTransfer.getData('text/plain');
                    const draggedEl = document.querySelector(`[data-word="${draggedWord}"]`);
                    if (zone.children.length === 0 && draggedEl) zone.appendChild(draggedEl);
                });
            });
        }
        
        function checkDragAndDrop(step) {
            let allCorrect = true;
            let answers = [];
            const dropZones = step.querySelectorAll('.drop-zone, .drop-zone-vocab');
            dropZones.forEach(zone => {
                zone.classList.remove('correct-drop', 'incorrect-drop');
                const droppedItem = zone.querySelector('.drag-item, .drag-item-vocab');
                const word = droppedItem ? droppedItem.textContent : 'Buit';
                answers.push(word);
                if (!droppedItem || droppedItem.dataset.word !== zone.dataset.accept) {
                    allCorrect = false;
                    zone.classList.add('incorrect-drop');
                } else {
                    zone.classList.add('correct-drop');
                }
            });
            return { correct: allCorrect, answer: answers.join(', ') };
        }

        function initializeQuiz(container) {
            const quizOptions = container.querySelectorAll('.quiz-option');
            quizOptions.forEach(option => {
                option.classList.remove('selected', 'correct', 'incorrect');
                option.addEventListener('click', () => {
                    option.closest('.quiz-options').querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                });
            });
        }
        
        function checkQuiz(step) {
            const selectedOption = step.querySelector('.quiz-option.selected');
            step.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('correct', 'incorrect'));
            
            if (selectedOption) {
                const isCorrect = selectedOption.dataset.correct === 'true';
                selectedOption.classList.add(isCorrect ? 'correct' : 'incorrect');
                step.querySelector('.quiz-option[data-correct="true"]').classList.add('correct');
                return { correct: isCorrect, answer: selectedOption.textContent.trim() };
            }
            step.querySelector('.quiz-option[data-correct="true"]').classList.add('correct');
            return { correct: false, answer: "No s'ha respost" };
        }

        // --- PDF Generation ---
        function generatePDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            let y = 20;

            doc.setFontSize(22).setFont('helvetica', 'bold').text('Justificant d\'Activitats - Afers Juvenils', 105, y, { align: 'center' });
            y += 15;
            doc.setFontSize(14).setFont('helvetica', 'normal').text(`Alumne/a: ${activityState.userName}`, 14, y);
            y += 8;
            doc.text(`Relat: ${activityState.selectedStoryTitle}`, 14, y);
            y += 8;
            doc.text(`Nivell: ${activityState.selectedLevel.charAt(0).toUpperCase() + activityState.selectedLevel.slice(1)}`, 14, y);
            y += 15;

            let correctAnswers = 0;
            doc.setFontSize(12);
            activityState.activityResults.forEach(result => {
                if (y > 270) { doc.addPage(); y = 20; }
                
                doc.setFont('helvetica', 'bold').text(`Activitat: ${result.title}`, 14, y);
                y += 7;
                doc.setFont('helvetica', 'normal');
                const answerLines = doc.splitTextToSize(`La teva resposta: ${result.userAnswer}`, 180);
                doc.text(answerLines, 14, y);
                y += answerLines.length * 5;

                if (result.isCorrect) {
                    doc.setTextColor(34, 139, 34).text('Resultat: Correcte ✓', 14, y);
                    correctAnswers++;
                } else {
                    doc.setTextColor(255, 0, 0).text('Resultat: Incorrecte / Saltat ✗', 14, y);
                }
                doc.setTextColor(0, 0, 0);
                y += 10;
                doc.line(14, y - 5, 196, y - 5);
            });

            const score = Math.round((correctAnswers / activityState.totalSteps) * 100);
            y += 10;
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFontSize(16).setFont('helvetica', 'bold').text(`Puntuació Final: ${score}% (${correctAnswers} de ${activityState.totalSteps} correctes)`, 105, y, { align: 'center' });
            
            const fileName = `AfersJuvenils_${activityState.userName.replace(/ /g, '_')}_${activityState.selectedStory}.pdf`;
            doc.save(fileName);
        }
        
        // --- Event Listeners Setup ---
        storyCards.forEach(card => card.addEventListener('click', () => showLevelsView(card)));
        levelBtns.forEach(btn => btn.addEventListener('click', () => showActivitiesView(btn)));
        backToStoriesBtn.addEventListener('click', showStoriesView);
        backToLevelsBtn.addEventListener('click', () => showLevelsView(document.querySelector('.story-card.active')));
        studentNameInput.addEventListener('input', () => {
            startActivitiesBtn.disabled = studentNameInput.value.trim() === '';
        });
        startActivitiesBtn.addEventListener('click', () => {
            activityState.userName = studentNameInput.value.trim();
            nameInputContainer.classList.add('hidden');
            mainActivityContent.classList.remove('hidden');
            const activitySetId = `activity-${activityState.selectedStory}-${activityState.selectedLevel}`;
            const targetActivitySet = document.getElementById(activitySetId) || noActivitiesPlaceholder;
            
            document.querySelectorAll('.activity-set').forEach(set => set.classList.add('hidden'));
            targetActivitySet.classList.remove('hidden');
            if (targetActivitySet.id !== 'no-activities-placeholder') {
                initializeActivitySet(targetActivitySet);
            }
        });
    }

});