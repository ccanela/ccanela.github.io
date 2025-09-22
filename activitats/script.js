document.addEventListener('DOMContentLoaded', function() {
    // --- GLOBAL HEADER LOGIC ---
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    }
    const currentPagePath = window.location.pathname;
    document.querySelectorAll('header nav a.nav-link, #mobile-menu a').forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath && linkPath.endsWith('activitats.html') && currentPagePath.includes('/activitats/')) {
            link.classList.add('active');
        }
    });

    // --- MAIN ACTIVITY PAGE LOGIC ---
    const activityWrapper = document.getElementById('activity-wrapper');
    if (!activityWrapper) return;

    let activityState = {
        userName: '',
        storyId: activityWrapper.dataset.storyId,
        storyTitle: activityWrapper.dataset.storyTitle,
        levelText: activityWrapper.dataset.levelText,
        currentStepIndex: 0,
        totalSteps: 0,
        activityResults: []
    };
    
    // NOTA: La variable 'draggedItem' ja no és necessària amb Sortable.js
    // let draggedItem = null; 

    const nameInputContainer = document.getElementById('name-input-container');
    const mainActivityContent = document.getElementById('main-activity-content');
    const completionMessage = document.getElementById('completion-message');
    const studentNameInput = document.getElementById('student-name');
    const startActivitiesBtn = document.getElementById('start-activities-btn');
    const activitySet = activityWrapper.querySelector('.activity-set');
    const steps = Array.from(activitySet.querySelectorAll('.activity-step'));

    const startActivities = () => {
        activityState.userName = studentNameInput.value.trim();
        if (!activityState.userName) return;
        nameInputContainer.classList.add('hidden');
        mainActivityContent.classList.remove('hidden');
        initializeActivitySet();
    };

    const initializeActivitySet = () => {
        activityState.currentStepIndex = 0;
        activityState.totalSteps = steps.length;
        activityState.activityResults = Array.from({ length: steps.length }, () => ({
            title: '', userAnswer: "No s'ha respost", isCorrect: false, attempts: 0
        }));
        steps.forEach((step, index) => {
            if (step.querySelector('.sortable-list') && !step.querySelector('.sortable-list').dataset.originalHtml) {
                step.querySelector('.sortable-list').dataset.originalHtml = step.querySelector('.sortable-list').innerHTML;
            }
            step.classList.toggle('hidden', index !== 0);
            resetActivityStep(step);
        });
        
        // NOVA FUNCIÓ per inicialitzar totes les instàncies de Sortable.js
        initializeSortableJS();

        updateProgressBar();
    };
    
    /**
     * NOVA FUNCIÓ: Inicialitza Sortable.js per a totes les activitats de drag-and-drop.
     * Aquesta funció substitueix tots els 'event listeners' manuals de drag-and-drop.
     * Funciona tant amb ratolí com en dispositius tàctils.
     */
    const initializeSortableJS = () => {
        steps.forEach((step, index) => {
            // Cas 1: Línia de temps (com a 'La nouvinguda - Avançat')
            const timelineContainer = step.querySelector('.words-container-timeline');
            const timelineDropZones = step.querySelectorAll('.drop-zone-timeline');
            if (timelineContainer && timelineDropZones.length > 0) {
                const groupName = `timeline-group-${index}`;
                
                // Contenidor d'origen
                new Sortable(timelineContainer, {
                    group: groupName,
                    animation: 150,
                    ghostClass: 'sortable-ghost'
                });

                // Zones de destinació (només admeten un element)
                timelineDropZones.forEach(zone => {
                    new Sortable(zone, {
                        group: groupName,
                        animation: 150,
                        ghostClass: 'sortable-ghost',
                        onAdd: function (evt) {
                            // Si s'afegeix un element i ja n'hi ha un altre, el vell torna a l'origen.
                            if (zone.children.length > 1) {
                                const oldItem = (evt.item === zone.children[0]) ? zone.children[1] : zone.children[0];
                                timelineContainer.appendChild(oldItem);
                            }
                        }
                    });
                });
            }

            // Afegeix aquí altres tipus d'activitats d'arrossegar si cal (ex: classificació, etc.)
            // Cas 2: Llista per ordenar
            const sortableList = step.querySelector('.sortable-list');
            if (sortableList) {
                new Sortable(sortableList, {
                    animation: 150,
                    ghostClass: 'sortable-ghost'
                });
            }
        });
    };


    const updateProgressBar = () => {
        const progress = activityState.totalSteps > 0 ? (activityState.currentStepIndex / activityState.totalSteps) * 100 : 0;
        document.getElementById('progress-bar').style.width = `${progress}%`;
        const currentStepForDisplay = activityState.currentStepIndex < activityState.totalSteps ? activityState.currentStepIndex + 1 : activityState.totalSteps;
        document.getElementById('progress-text').textContent = `Pas ${currentStepForDisplay} / ${activityState.totalSteps}`;
    };

    const goToNextStep = () => {
        if (activityState.currentStepIndex < activityState.totalSteps) {
            steps[activityState.currentStepIndex].classList.add('hidden');
        }
        activityState.currentStepIndex++;
        updateProgressBar();
        if (activityState.currentStepIndex < activityState.totalSteps) {
            const nextStep = steps[activityState.currentStepIndex];
            resetActivityStep(nextStep);
            nextStep.classList.remove('hidden');
        } else {
            document.getElementById('progress-text').textContent = `Completat!`;
            completionMessage.classList.remove('hidden');
        }
    };

    const resetActivityStep = (step) => {
        const feedbackMsg = step.querySelector('.feedback-msg');
        let checkBtn = step.querySelector('.check-btn');
        feedbackMsg.textContent = '';
        feedbackMsg.className = 'feedback-msg font-medium h-6';
        if (checkBtn) {
            checkBtn.textContent = step.querySelector('textarea') ? 'Desar i continuar' : 'Verificar';
            checkBtn.classList.remove('hidden');
            checkBtn.disabled = false;
        }
        step.querySelector('.retry-btn')?.remove();
        step.querySelector('.next-btn')?.remove();
        step.querySelector('.next-correct-btn')?.remove();

        if (checkBtn) {
            const newCheck = checkBtn.cloneNode(true);
            checkBtn.parentNode.replaceChild(newCheck, checkBtn);
            newCheck.addEventListener('click', () => handleCheck(step));
        }

        // Reset per a la línia de temps (drag & drop)
        const timelineContainer = step.querySelector('.words-container-timeline');
        if (timelineContainer) {
            step.querySelectorAll('.drag-item-timeline').forEach(item => {
                timelineContainer.appendChild(item);
            });
            step.querySelectorAll('.drop-zone-timeline').forEach(zone => {
                zone.innerHTML = '';
            });
        }
        
        // Reset Drag & Drop (single item) and Classification (multi-item)
        if (step.querySelector('.drop-zone-vocab, .drop-zone-classify')) {
            const wordsContainer = step.querySelector('.words-container');
            step.querySelectorAll('.drag-item-vocab').forEach(p => {
                wordsContainer.appendChild(p);
                p.classList.remove('correct-order', 'incorrect-order');
            });
            step.querySelectorAll('.drop-zone-vocab, .drop-zone-classify').forEach(z => {
                z.innerHTML = '';
                z.classList.remove('correct-drop', 'incorrect-drop');
            });
        }
        // Reset Sortable List
        if (step.querySelector('.sortable-list')) {
            const list = step.querySelector('.sortable-list');
            if (list.dataset.originalHtml) list.innerHTML = list.dataset.originalHtml;
            list.querySelectorAll('.sortable-item').forEach(item => item.classList.remove('correct-order', 'incorrect-order'));
        }
        // Reset Text Area
        if (step.querySelector('textarea')) {
            step.querySelector('textarea').value = '';
        }
        // Reset Quiz (single and multi)
        step.querySelectorAll('.quiz-options').forEach(container => {
            const isMultipleChoice = container.classList.contains('multiple-choice');
            container.querySelectorAll('.quiz-option').forEach(option => {
                const newOption = option.cloneNode(true);
                option.parentNode.replaceChild(newOption, option);
                newOption.classList.remove('selected', 'correct', 'incorrect');
                newOption.addEventListener('click', () => {
                    if (isMultipleChoice) {
                        newOption.classList.toggle('selected');
                    } else {
                        const scope = newOption.closest('.multi-quiz-group') || step;
                        scope.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
                        newOption.classList.add('selected');
                    }
                });
            });
        });
    };

    const handleCheck = (step) => {
        const currentResult = activityState.activityResults[activityState.currentStepIndex];
        currentResult.attempts++;
        let result = { correct: false, answer: "No s'ha respost", isTextarea: false };

        if (step.querySelector('.drop-zone-timeline')) result = checkTimeline(step); // NOU CHECKER ESPECÍFIC
        else if (step.querySelector('.quiz-options.multiple-choice')) result = checkMultipleChoiceQuiz(step);
        else if (step.querySelector('.drop-zone-classify')) result = checkClassification(step);
        else if (step.querySelector('.multi-quiz-group')) result = checkMultiQuiz(step);
        else if (step.querySelector('.sortable-list')) result = checkSortableList(step);
        else if (step.querySelector('.drop-zone-vocab')) result = checkDragAndDrop(step);
        else if (step.querySelector('.quiz-options')) result = checkQuiz(step);
        else if (step.querySelector('textarea')) result = checkTextarea(step);

        saveResult(step, result.answer, result.correct);
        const feedbackMsg = step.querySelector('.feedback-msg');
        const checkBtn = step.querySelector('.check-btn');

        if (result.correct) {
            feedbackMsg.textContent = result.isTextarea ? 'Resposta desada.' : 'Molt bé! Resposta correcta.';
            feedbackMsg.className = 'feedback-msg font-medium h-6 text-green-600';
            checkBtn.classList.add('hidden');
            let nextBtn = step.querySelector('.next-correct-btn');
            if (!nextBtn) {
                nextBtn = document.createElement('button');
                nextBtn.className = 'next-correct-btn bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition';
                checkBtn.parentNode.insertBefore(nextBtn, feedbackMsg);
            }
            const isLastStep = activityState.currentStepIndex === activityState.totalSteps - 1;
            nextBtn.textContent = isLastStep ? 'Acabar nivell' : 'Següent activitat';
            nextBtn.onclick = goToNextStep;
        } else {
            if (!result.isTextarea) {
                feedbackMsg.textContent = 'Hi ha alguns errors. Torna-ho a intentar.';
                feedbackMsg.className = 'feedback-msg font-medium h-6 text-red-600';
                checkBtn.classList.add('hidden');
                let retryBtn = step.querySelector('.retry-btn');
                if (!retryBtn) {
                    retryBtn = document.createElement('button');
                    retryBtn.className = 'retry-btn bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition mr-4';
                    retryBtn.textContent = 'Tornar-ho a intentar';
                    checkBtn.parentNode.insertBefore(retryBtn, feedbackMsg);
                    retryBtn.addEventListener('click', () => resetActivityStep(step));
                }
                let nextBtn = step.querySelector('.next-btn');
                if (!nextBtn) {
                    nextBtn = document.createElement('button');
                    nextBtn.className = 'next-btn bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-90 transition';
                    nextBtn.textContent = 'Següent activitat';
                    checkBtn.parentNode.insertBefore(nextBtn, feedbackMsg);
                    nextBtn.addEventListener('click', goToNextStep);
                }
            }
        }
    };

    const saveResult = (step, answer, isCorrect) => {
        const title = step.dataset.stepTitle || `Activitat ${activityState.currentStepIndex + 1}`;
        const currentResult = activityState.activityResults[activityState.currentStepIndex];
        if (currentResult) {
            currentResult.title = title;
            currentResult.userAnswer = answer;
            currentResult.isCorrect = isCorrect;
            currentResult.isTextarea = (step.querySelector('textarea') !== null);
        }
    };

    // --- CHECKERS ---
    const checkTimeline = (step) => {
        let allCorrect = true;
        step.querySelectorAll('.drop-zone-timeline').forEach(zone => {
            zone.classList.remove('correct-drop', 'incorrect-drop');
            const droppedItem = zone.querySelector('.drag-item-timeline');
            if (!droppedItem || droppedItem.dataset.word !== zone.dataset.accept) {
                allCorrect = false;
                zone.classList.add('incorrect-drop');
            } else {
                zone.classList.add('correct-drop');
            }
        });
        return { correct: allCorrect, answer: getStudentAnswerReadable(step) };
    };

    const checkDragAndDrop = (step) => { let allCorrect = true; step.querySelectorAll('.drop-zone-vocab').forEach(zone => { zone.classList.remove('correct-drop', 'incorrect-drop'); const droppedItem = zone.querySelector('.drag-item-vocab'); if (!droppedItem || droppedItem.dataset.word !== zone.dataset.accept) { allCorrect = false; zone.classList.add('incorrect-drop'); } else { zone.classList.add('correct-drop'); } }); return { correct: allCorrect, answer: getStudentAnswerReadable(step) }; };
    const checkSortableList = (step) => { const list = step.querySelector('.sortable-list'); const correctOrder = list.dataset.correctOrder.split(','); const currentItems = Array.from(list.querySelectorAll('.sortable-item')); let isCorrect = true; currentItems.forEach((item, index) => { item.classList.remove('correct-order', 'incorrect-drop'); if (item.dataset.id !== correctOrder[index]) { isCorrect = false; item.classList.add('incorrect-order'); } else { item.classList.add('correct-order'); } }); return { correct: isCorrect, answer: getStudentAnswerReadable(step) }; };
    const checkQuiz = (step) => { const selectedOption = step.querySelector('.quiz-option.selected'); if (!selectedOption) return { correct: false, answer: "No s'ha respost" }; const isCorrect = selectedOption.dataset.correct === 'true'; step.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('correct', 'incorrect')); selectedOption.classList.add(isCorrect ? 'correct' : 'incorrect'); return { correct: isCorrect, answer: selectedOption.textContent.trim() }; };
    const checkMultiQuiz = (step) => { let allCorrect = true; step.querySelectorAll('.multi-quiz-group').forEach(group => { const selectedOption = group.querySelector('.quiz-option.selected'); group.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('correct', 'incorrect')); if (!selectedOption || selectedOption.dataset.correct !== 'true') { allCorrect = false; if(selectedOption) selectedOption.classList.add('incorrect'); } else { selectedOption.classList.add('correct'); } }); return { correct: allCorrect, answer: getStudentAnswerReadable(step) }; };
    const checkTextarea = (step) => { const answer = step.querySelector('textarea').value.trim(); if (answer.length > 20) { return { correct: true, answer: answer, isTextarea: true }; } else { step.querySelector('.feedback-msg').textContent = 'Cal escriure una resposta més elaborada.'; step.querySelector('.feedback-msg').className = 'feedback-msg font-medium h-6 text-red-600'; return { correct: false, answer: 'Resposta massa curta', isTextarea: true }; } };
    const checkClassification = (step) => { let allCorrect = true; const wordsContainer = step.querySelector('.words-container'); if (wordsContainer.children.length > 0) { allCorrect = false; Array.from(wordsContainer.children).forEach(item => item.classList.add('incorrect-order'));} step.querySelectorAll('.drop-zone-classify').forEach(zone => { const expectedCategory = zone.dataset.accept; Array.from(zone.children).forEach(item => { item.classList.remove('correct-order', 'incorrect-order'); if (item.dataset.category === expectedCategory) { item.classList.add('correct-order'); } else { item.classList.add('incorrect-order'); allCorrect = false; } }); }); return { correct: allCorrect, answer: getStudentAnswerReadable(step) }; };
    const checkMultipleChoiceQuiz = (step) => { let allCorrect = true; const options = step.querySelectorAll('.quiz-option'); const selectedOptions = step.querySelectorAll('.quiz-option.selected'); const correctOptions = step.querySelectorAll('.quiz-option[data-correct="true"]'); if (selectedOptions.length !== correctOptions.length) { allCorrect = false; } options.forEach(opt => { opt.classList.remove('correct', 'incorrect'); const isSelected = opt.classList.contains('selected'); const shouldBeSelected = opt.dataset.correct === 'true'; if (isSelected && shouldBeSelected) { opt.classList.add('correct'); } else if (isSelected && !shouldBeSelected) { opt.classList.add('incorrect'); allCorrect = false; } else if (!isSelected && shouldBeSelected) { allCorrect = false; } }); return { correct: allCorrect, answer: getStudentAnswerReadable(step) }; };

    // --- PDF & HELPERS ---
    const generatePDF = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const today = new Date().toLocaleDateString('ca-ES');
        const marginX = 14; const contentWidth = 180; let y = 20;

        doc.setFont('helvetica', 'bold').setFontSize(20).text("Justificant d'Activitats - Afers Juvenils", 105, y, { align: 'center' });
        y += 12; doc.setFont('helvetica', 'normal').setFontSize(12);
        doc.text(`Alumne/a: ${activityState.userName}`, marginX, y);
        doc.text(`Data: ${today}`, 210 - marginX, y, { align: 'right' });
        y += 7; doc.text(`Relat: ${activityState.storyTitle}`, marginX, y);
        y += 7; doc.text(`Nivell: ${activityState.levelText}`, marginX, y);
        y += 8; doc.line(marginX, y, 210 - marginX, y); y += 6;

        let correctAnswers = 0;
        activityState.activityResults.forEach((result, idx) => {
            const ensureSpace = (needed = 10) => { if (y + needed > 287) { doc.addPage(); y = 20; } };
            ensureSpace(14);
            const step = steps[idx];
            doc.setFont('helvetica', 'bold').setFontSize(13).text(`Activitat ${idx + 1}: ${result.title}`, marginX, y); y += 6;
            doc.setFont('helvetica', 'bold').setFontSize(11).text('Enunciat:', marginX, y); y += 5;
            doc.setFont('helvetica', 'normal');
            const enuncLines = doc.splitTextToSize(getActivityEnunciat(step), contentWidth);
            enuncLines.forEach(line => { ensureSpace(6); doc.text(line, marginX, y); y += 5; });
            y += 2;
            doc.setFont('helvetica', 'bold').text('Resposta de l’alumne:', marginX, y); y += 5;
            doc.setFont('helvetica', 'normal');
            const ansLines = doc.splitTextToSize(result.userAnswer, contentWidth);
            ansLines.forEach(line => { ensureSpace(6); doc.text(line, marginX, y); y += 5; });
            y += 2;

            let statusText = '', color = [0, 0, 0];
            if (result.isCorrect && result.isTextarea) { statusText = 'Resultat: Resposta oberta desada.'; color = [100, 100, 100]; correctAnswers++; }
            else if (result.isCorrect) { statusText = 'Resultat: Correcte ✓'; color = [34, 139, 34]; correctAnswers++; }
            else { statusText = `Resultat: ${result.userAnswer === 'Saltat' ? 'Saltat' : 'Incorrecte'} ✗`; color = [220, 20, 60]; }
            
            ensureSpace(10);
            doc.setTextColor(color[0], color[1], color[2]).text(statusText, marginX, y);
            doc.setTextColor(0, 0, 0);
            doc.text(`Intents: ${result.attempts}`, 210 - marginX, y, { align: 'right' });
            y += 7; doc.setDrawColor(200).line(marginX, y, 210 - marginX, y); y += 6;
        });

        const score = Math.round((correctAnswers / activityState.totalSteps) * 100);
        if (y + 12 > 287) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold').setFontSize(14).text(`Puntuació Final: ${score}% (${correctAnswers} de ${activityState.totalSteps} correctes)`, 105, y, { align: 'center' });
        
        const sanitizedUserName = activityState.userName.replace(/ /g, '_');
        const sanitizedLevel = activityState.levelText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, "");
        const fileName = `${sanitizedUserName}_justificant_${activityState.storyId}_${sanitizedLevel}.pdf`;
        doc.save(fileName);
    };

    function getActivityEnunciat(step) {
        const mainQuestion = step.querySelector('h4 + p')?.innerText?.trim() || '';
        if (step.querySelector('.multi-quiz-group')) { const parts = [mainQuestion]; step.querySelectorAll('.multi-quiz-group').forEach(group => { const claim = group.querySelector('p:first-child')?.innerText?.trim(); parts.push(`\n${claim}`); }); return parts.join('\n'); }
        if (step.querySelector('.quiz-options')) { const options = Array.from(step.querySelectorAll('.quiz-option')).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt.innerText.trim()}`); return [mainQuestion, ...options].join('\n'); }
        if (step.querySelector('.drop-zone-vocab')) { const lines = []; step.querySelectorAll('.flex.items-center.bg-secondary\\/30, .grid > div > div').forEach(row => { const text = row.querySelector('p')?.innerText?.trim() || row.dataset.accept; lines.push(`[____] — ${text}`); }); return `${mainQuestion}\n${lines.join('\n')}`; }
        if (step.querySelector('.drop-zone-classify')) { return mainQuestion; }
        if (step.querySelector('p.text-lg.leading-loose')) { const clone = step.querySelector('p.text-lg.leading-loose').cloneNode(true); clone.querySelectorAll('.drop-zone').forEach(z => { z.textContent = '____'; }); return `${mainQuestion}\n\n${clone.innerText.trim()}`; }
        return mainQuestion;
    }

    function getStudentAnswerReadable(step) {
        if (step.querySelector('.drop-zone-timeline')) {
            const answers = [];
            step.querySelectorAll('.flex-col.items-center').forEach(milestone => {
                const title = milestone.querySelector('h5').innerText.trim();
                const dropZone = milestone.querySelector('.drop-zone-timeline');
                const droppedItem = dropZone.querySelector('.drag-item-timeline');
                const answer = droppedItem ? `"${droppedItem.innerText.trim()}"` : "(Buit)";
                answers.push(`${title}: ${answer}`);
            });
            return answers.join('\n');
        }
        if (step.querySelector('.drop-zone-classify')) { const answers = []; step.querySelectorAll('.drop-zone-classify').forEach(zone => { const categoryTitle = zone.querySelector('p')?.innerText || zone.dataset.accept; answers.push(`\n[Categoria: ${categoryTitle}]`); const items = Array.from(zone.querySelectorAll('.drag-item-vocab')); if (items.length > 0) { items.forEach(item => answers.push(`- "${item.innerText.trim()}"`)); } else { answers.push("- (Buit)"); } }); return answers.join('\n');}
        if (step.querySelector('.multi-quiz-group')) { const answers = []; step.querySelectorAll('.multi-quiz-group').forEach(group => { const claim = group.querySelector('p:first-child')?.innerText?.trim(); const selected = group.querySelector('.quiz-option.selected'); answers.push(`${claim}\n  ↳ Resposta: ${selected ? selected.innerText.trim() : 'No seleccionat'}`); }); return answers.join('\n\n');}
        if (step.querySelector('.drop-zone-vocab')) { const lines = []; step.querySelectorAll('.drop-zone-vocab').forEach(zone => { const parentText = zone.closest('div').querySelector('p')?.innerText.trim() || zone.dataset.accept; const chosen = zone.querySelector('.drag-item-vocab')?.innerText?.trim() || '—'; if (step.querySelector('p.text-lg.leading-loose')) { return; } lines.push(`[${chosen}] — ${parentText}`); }); if (step.querySelector('p.text-lg.leading-loose')) { const clone = step.querySelector('p.text-lg.leading-loose').cloneNode(true); clone.querySelectorAll('.drop-zone').forEach(z => { const chosen = z.querySelector('.drag-item'); z.textContent = chosen ? `"${chosen.innerText.trim()}"` : '—'; }); return clone.innerText.trim(); } return lines.join('\n'); }
        if (step.querySelector('.sortable-list')) { const items = step.querySelectorAll('.sortable-list .sortable-item'); return Array.from(items).map((item, index) => `${index + 1}. ${item.innerText.trim()}`).join('\n'); }
        if (step.querySelector('.quiz-options')) { const selected = step.querySelectorAll('.quiz-option.selected'); if (selected.length > 0) { return Array.from(selected).map(s => s.textContent.trim()).join(', '); } return 'No s’ha respost'; }
        if (step.querySelector('textarea')) { return step.querySelector('textarea').value.trim() || 'No s’ha respost'; }
        return "No s'ha pogut determinar la resposta.";
    }

    // --- EVENT LISTENERS ---
    studentNameInput.addEventListener('input', () => startActivitiesBtn.disabled = studentNameInput.value.trim() === '');
    startActivitiesBtn.addEventListener('click', startActivities);
    
    // S'HAN ELIMINAT ELS 'EVENT LISTENERS' DE DRAG & DROP MANUALS.
    // Sortable.js s'encarrega ara de tot.
    
    document.getElementById('download-pdf-btn').addEventListener('click', generatePDF);
    document.getElementById('restart-level-btn').addEventListener('click', () => location.reload());
});