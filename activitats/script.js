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
    let draggedItem = null;

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
        updateProgressBar();
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

        // Reset Drag & Drop
        if (step.querySelector('.drop-zone-vocab')) {
            const wordsContainer = step.querySelector('.words-container');
            step.querySelectorAll('.drag-item-vocab').forEach(p => wordsContainer.appendChild(p));
            step.querySelectorAll('.drop-zone-vocab').forEach(z => {
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
        step.querySelectorAll('.multi-quiz-group, .quiz-options').forEach(container => {
            container.querySelectorAll('.quiz-option').forEach(option => {
                const newOption = option.cloneNode(true);
                option.parentNode.replaceChild(newOption, option);
                newOption.classList.remove('selected', 'correct', 'incorrect');
                newOption.addEventListener('click', () => {
                    container.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
                    newOption.classList.add('selected');
                });
            });
        });
    };

    const handleCheck = (step) => {
        const currentResult = activityState.activityResults[activityState.currentStepIndex];
        currentResult.attempts++;
        let result = { correct: false, answer: "No s'ha respost", isTextarea: false };

        if (step.querySelector('.multi-quiz-group')) result = checkMultiQuiz(step);
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
    const checkDragAndDrop = (step) => { let allCorrect = true; step.querySelectorAll('.drop-zone-vocab').forEach(zone => { zone.classList.remove('correct-drop', 'incorrect-drop'); const droppedItem = zone.querySelector('.drag-item-vocab'); if (!droppedItem || droppedItem.dataset.word !== zone.dataset.accept) { allCorrect = false; zone.classList.add('incorrect-drop'); } else { zone.classList.add('correct-drop'); } }); return { correct: allCorrect, answer: getStudentAnswerReadable(step) }; };
    const checkSortableList = (step) => { const list = step.querySelector('.sortable-list'); const correctOrder = list.dataset.correctOrder.split(','); const currentItems = Array.from(list.querySelectorAll('.sortable-item')); let isCorrect = true; currentItems.forEach((item, index) => { item.classList.remove('correct-order', 'incorrect-order'); if (item.dataset.id !== correctOrder[index]) { isCorrect = false; item.classList.add('incorrect-order'); } else { item.classList.add('correct-order'); } }); return { correct: isCorrect, answer: getStudentAnswerReadable(step) }; };
    const checkQuiz = (step) => { const selectedOption = step.querySelector('.quiz-option.selected'); if (!selectedOption) return { correct: false, answer: "No s'ha respost" }; const isCorrect = selectedOption.dataset.correct === 'true'; step.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('correct', 'incorrect')); selectedOption.classList.add(isCorrect ? 'correct' : 'incorrect'); return { correct: isCorrect, answer: selectedOption.textContent.trim() }; };
    const checkMultiQuiz = (step) => { let allCorrect = true; step.querySelectorAll('.multi-quiz-group').forEach(group => { const selectedOption = group.querySelector('.quiz-option.selected'); group.querySelectorAll('.quiz-option').forEach(opt => opt.classList.remove('correct', 'incorrect')); if (!selectedOption || selectedOption.dataset.correct !== 'true') { allCorrect = false; if(selectedOption) selectedOption.classList.add('incorrect'); } else { selectedOption.classList.add('correct'); } }); return { correct: allCorrect, answer: getStudentAnswerReadable(step) }; };
    const checkTextarea = (step) => { const answer = step.querySelector('textarea').value.trim(); if (answer.length > 20) { return { correct: true, answer: answer, isTextarea: true }; } else { step.querySelector('.feedback-msg').textContent = 'Cal escriure una resposta més elaborada.'; step.querySelector('.feedback-msg').className = 'feedback-msg font-medium h-6 text-red-600'; return { correct: false, answer: 'Resposta massa curta', isTextarea: true }; } };

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
        if (step.querySelector('.multi-quiz-group')) { const parts = [mainQuestion]; step.querySelectorAll('.multi-quiz-group').forEach(group => { const claim = group.querySelector('p.font-bold')?.innerText?.trim(); parts.push(`\n${claim}`); group.querySelectorAll('.quiz-option').forEach((opt, i) => { parts.push(`${String.fromCharCode(97 + i)}) ${opt.innerText.trim()}`); }); }); return parts.join('\n'); }
        if (step.querySelector('.quiz-options')) { const options = Array.from(step.querySelectorAll('.quiz-option')).map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt.innerText.trim()}`); return [mainQuestion, ...options].join('\n'); }
        if (step.querySelector('.drop-zone-vocab')) { const lines = []; step.querySelectorAll('.flex.items-center.bg-secondary\\/30').forEach(row => { lines.push(`[____] — ${row.querySelector('p')?.innerText?.trim() || ''}`); }); return `${mainQuestion}\n${lines.join('\n')}`; }
        return mainQuestion;
    }

    function getStudentAnswerReadable(step) {
        if (step.querySelector('.multi-quiz-group')) { const answers = []; step.querySelectorAll('.multi-quiz-group').forEach(group => { const claim = group.querySelector('p.font-bold')?.innerText?.trim(); const selected = group.querySelector('.quiz-option.selected'); answers.push(`${claim}\nResposta: ${selected ? selected.innerText.trim() : 'No seleccionat'}`); }); return answers.join('\n\n');}
        if (step.querySelector('.drop-zone-vocab')) { const lines = []; step.querySelectorAll('.flex.items-center.bg-secondary\\/30').forEach(row => { const chosen = row.querySelector('.drag-item-vocab')?.innerText?.trim() || '—'; lines.push(`[${chosen}] — ${row.querySelector('p')?.innerText?.trim() || ''}`); }); return lines.join('\n'); }
        if (step.querySelector('.sortable-list')) { const items = step.querySelectorAll('.sortable-list .sortable-item'); return Array.from(items).map((item, index) => `${index + 1}. ${item.innerText.trim()}`).join('\n'); }
        if (step.querySelector('.quiz-options')) { const selected = step.querySelector('.quiz-option.selected, .quiz-option.correct, .quiz-option.incorrect'); return selected ? selected.innerText.trim() : 'No s’ha respost'; }
        if (step.querySelector('textarea')) { return step.querySelector('textarea').value.trim() || 'No s’ha respost'; }
        return "No s'ha pogut determinar la resposta.";
    }

    // --- EVENT LISTENERS ---
    studentNameInput.addEventListener('input', () => startActivitiesBtn.disabled = studentNameInput.value.trim() === '');
    startActivitiesBtn.addEventListener('click', startActivities);
    
    activitySet.addEventListener('dragstart', (e) => { if (e.target.matches('.drag-item-vocab, .sortable-item')) { draggedItem = e.target; setTimeout(() => e.target.classList.add('opacity-50'), 0); } });
    activitySet.addEventListener('dragend', () => { if(draggedItem) { draggedItem.classList.remove('opacity-50'); draggedItem = null; } });
    activitySet.addEventListener('dragover', (e) => { e.preventDefault(); const target = e.target.closest('.drop-zone-vocab, .sortable-item'); if (!target || !draggedItem) return; target.classList.add('highlight'); if (target.matches('.sortable-item')) { const container = target.parentElement; const afterElement = getDragAfterElement(container, e.clientY); if (afterElement == null) container.appendChild(draggedItem); else container.insertBefore(draggedItem, afterElement); } });
    activitySet.addEventListener('dragleave', (e) => { e.target.closest('.drop-zone-vocab, .sortable-item')?.classList.remove('highlight'); });
    activitySet.addEventListener('drop', (e) => { e.preventDefault(); e.target.closest('.highlight')?.classList.remove('highlight'); const dropZone = e.target.closest('.drop-zone-vocab'); if(dropZone && draggedItem && draggedItem.matches('.drag-item-vocab')) { if (dropZone.children.length > 0) { draggedItem.closest('.activity-step').querySelector('.words-container').appendChild(dropZone.firstElementChild); } dropZone.appendChild(draggedItem); } });
    function getDragAfterElement(container, y) { const draggableElements = [...container.querySelectorAll('.sortable-item:not(.opacity-50)')]; return draggableElements.reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2; if (offset < 0 && offset > closest.offset) { return { offset: offset, element: child }; } else { return closest; } }, { offset: Number.NEGATIVE_INFINITY }).element; }

    document.getElementById('download-pdf-btn').addEventListener('click', generatePDF);
    document.getElementById('restart-level-btn').addEventListener('click', () => location.reload());
});