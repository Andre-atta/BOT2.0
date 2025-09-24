let questions = []; // verranno caricate o generate
let currentQuestionIndex = 0;
let score = 0;
let totalQuestions = 0;
let currentQuizType = ''; // 'diritto' o 'ium'
let wrongAnswers = []; // per tracciare le risposte sbagliate
let wrongCount = {}; // per tracciare quante volte ogni domanda è stata sbagliata
let allQuestions = {
    diritto: [],
    ium: []
};

let lastEvaluation = null; // voto finale
let lastEvaluationMessage = ""; // messaggio finale

const questionNumberEl = document.getElementById("questionNumber");
const questionTextEl = document.getElementById("questionText");
const answersContainerEl = document.getElementById("answersContainer");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("nextBtn");
const scoreDisplay = document.getElementById("scoreDisplay");
const progressFill = document.getElementById("progressFill");

function loadAllQuestions() {
    // Carica entrambi i file JSON
    Promise.all([
        fetch('Domande/Diritto.json').then(response => response.json()),
        fetch('Domande/Ium.json').then(response => response.json())
    ])
        .then(([dirittoData, iumData]) => {
            dirittoData.forEach((q, i) => q.id = `diritto_${i}`);
            iumData.forEach((q, i) => q.id = `ium_${i}`);
            allQuestions.diritto = dirittoData;
            allQuestions.ium = iumData;

            // Aggiorna i contatori nel menu
            document.getElementById('dirittoCount').textContent = `(${dirittoData.length} domande)`;
            document.getElementById('iumCount').textContent = `(${iumData.length} domande)`;
        })
        .catch(err => {
            console.error("Errore nel caricamento delle domande:", err);
            document.getElementById('dirittoCount').textContent = "(Errore)";
            document.getElementById('iumCount').textContent = "(Errore)";
            alert("Errore nel caricamento di uno o entrambi i file delle domande: " + err);
        });
}

function selectQuizType(type) {
    currentQuizType = type;
    questions = [...allQuestions[type]]; // Copia le domande del tipo selezionato

    // Aggiorna il titolo e la descrizione nella schermata di selezione modalità
    const titleEl = document.getElementById('selectedQuizTitle');
    const descEl = document.getElementById('selectedQuizDescription');

    if (type === 'diritto') {
        titleEl.textContent = '📚 Diritto dell\'Informatica';
        descEl.textContent = `Quiz con ${questions.length} domande sul Diritto dell'Informatica`;
    } else if (type === 'ium') {
        titleEl.textContent = '💻 IUM (Interazione Uomo-Macchina)';
        descEl.textContent = `Quiz con ${questions.length} domande su IUM`;
    }

    showScreen("modeSelectionScreen");
}

function goBackToSelection() {
    showScreen("startScreen");
}

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    totalQuestions = questions.length;
    showScreen("questionScreen");
    loadQuestion();
}

function weightedRandomSample(array, weights, sampleSize) {
    let result = [];
    let pool = array.map((item, idx) => ({ item, weight: weights[idx] }));
    let total = pool.reduce((sum, el) => sum + el.weight, 0);

    for (let i = 0; i < sampleSize && pool.length > 0; i++) {
        let r = Math.random() * total;
        let acc = 0;
        let chosenIdx = 0;
        for (let j = 0; j < pool.length; j++) {
            acc += pool[j].weight;
            if (r <= acc) {
                chosenIdx = j;
                break;
            }
        }
        result.push(pool[chosenIdx].item);
        total -= pool[chosenIdx].weight;
        pool.splice(chosenIdx, 1);
    }
    return result;
}

function startRandomQuiz() {
    const pool = allQuestions[currentQuizType];
    // Calcola pesi: 1 + numero errori (almeno 1 per ogni domanda)
    const weights = pool.map(q => 1 + (wrongCount[q.id] || 0));
    // Estrai 20 domande random pesate
    questions = weightedRandomSample(pool, weights, 10);
    // Mescola l'ordine di presentazione
    shuffleArray(questions);
    currentQuestionIndex = 0;
    score = 0;
    totalQuestions = questions.length;
    showScreen("questionScreen");
    loadQuestion();
}

function showScreen(screenId) {
    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("modeSelectionScreen").classList.add("hidden");
    document.getElementById("questionScreen").classList.add("hidden");
    document.getElementById("resultsScreen").classList.add("hidden");
    document.getElementById(screenId).classList.remove("hidden");
}

function loadQuestion() {
    const q = questions[currentQuestionIndex];
    // Numerazione dinamica, indipendente dal testo della domanda
    questionNumberEl.textContent = `Domanda ${currentQuestionIndex + 1} di ${totalQuestions}`;

    // Pulisci il contenuto precedente
    questionTextEl.innerHTML = q.quest.replace(/\n/g, "<br>");

    // Aggiungi l'immagine della domanda se presente
    if (q.image && q.image.trim() !== "") {
        const imgContainer = document.createElement("div");
        imgContainer.style.margin = "15px 0";
        imgContainer.style.textAlign = "center";

        const img = document.createElement("img");
        img.src = q.image;
        img.style.maxWidth = "100%";
        img.style.maxHeight = "300px";
        img.style.borderRadius = "8px";
        img.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
        img.alt = "Illustrazione della domanda";

        imgContainer.appendChild(img);
        questionTextEl.appendChild(imgContainer);
    }

    answersContainerEl.innerHTML = "";
    feedbackEl.classList.add("hidden");
    feedbackEl.textContent = "";

    q.answers.forEach((answer, index) => {
        const btn = document.createElement("div");
        btn.classList.add("answer-option");

        // Aggiungi il testo della risposta
        const textSpan = document.createElement("span");
        textSpan.textContent = answer.text;
        btn.appendChild(textSpan);

        // Aggiungi l'immagine della risposta se presente
        if (answer.image && answer.image.trim() !== "") {
            const imgContainer = document.createElement("div");
            imgContainer.style.marginTop = "10px";
            imgContainer.style.textAlign = "center";

            const img = document.createElement("img");
            img.src = answer.image;
            img.style.maxWidth = "100%";
            img.style.maxHeight = "150px";
            img.style.borderRadius = "4px";
            img.alt = "Illustrazione della risposta";

            imgContainer.appendChild(img);
            btn.appendChild(imgContainer);

            // Aggiungi classe per risposte con immagini
            btn.classList.add("has-image");
        }

        btn.onclick = () => selectAnswer(index, btn);
        answersContainerEl.appendChild(btn);
    });

    updateProgress();
    updateScoreDisplay();
    nextBtn.disabled = true;
}

function selectAnswer(index, element) {
    const q = questions[currentQuestionIndex];
    const correct = q.correct;

    if (index !== correct) {
        wrongAnswers.push({
            question: q.quest,
            yourAnswer: q.answers[index].text,
            correctAnswer: q.answers[correct].text,
            questionImage: q.image || null,
            yourAnswerImage: q.answers[index].image || null,
            correctAnswerImage: q.answers[correct].image || null
        });
        wrongCount[q.id] = (wrongCount[q.id] || 0) + 1;
    }

    const answerOptions = document.querySelectorAll(".answer-option");
    answerOptions.forEach((btn, i) => {
        btn.classList.remove("selected", "correct", "incorrect");
        if (i === correct) btn.classList.add("correct");
        else if (i === index) btn.classList.add("incorrect");
    });

    if (index === correct) {
        score++;
        feedbackEl.textContent = "✅ Corretto!";
        feedbackEl.className = "feedback correct";
    } else {
        feedbackEl.textContent = "❌ Sbagliato.";
        feedbackEl.className = "feedback incorrect";
    }

    feedbackEl.classList.remove("hidden");
    nextBtn.disabled = false;
    updateScoreDisplay();
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < totalQuestions) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    showScreen("resultsScreen");

    let message = "Ben fatto!";
    let evaluation = 29;
    if (score <= 5) {
        message = "Zio non l'hai passato";
    } else if (score === 6) {
        message = "Meno 2 punti bro";
        evaluation = 27;
    } else if (score === 7) {
        message = "Meno 1 punto dude";
        evaluation = 28;
    } else if (score === 8) {
        message = "OKé ti tieni il voto che hai";
        evaluation = 29;
    } else if (score === 9) {
        message = "+1 le'ss gooo";
        evaluation = 30;
    } else if (score === totalQuestions) {
        message = "Perfetto! 30 e lode bro";
        evaluation = "30 e lode";
    }
    lastEvaluation = evaluation;
    lastEvaluationMessage = message;

    document.getElementById("finalScore").textContent = `Punteggio: ${score}/${totalQuestions}`;
    document.getElementById("correctAnswers").textContent = score;
    document.getElementById("incorrectAnswers").textContent = totalQuestions - score;
    document.getElementById("accuracyPercentage").textContent = `${Math.round((score / totalQuestions) * 100)}%`;
    document.getElementById("scoreMessage").textContent = `${message} (Voto: ${evaluation})`;
}

function restartQuiz() {
    location.reload();
}

function updateProgress() {
    const progress = ((currentQuestionIndex) / totalQuestions) * 100;
    progressFill.style.width = `${progress}%`;
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Punteggio: ${score}/${totalQuestions}`;
}

// Utility
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
// Aggiungi gli event listener per i pulsanti del menu
function showWrongAnswers() {
    const container = document.getElementById("wrongAnswersContainer");
    const list = document.getElementById("wrongAnswersList");
    const btn = document.getElementById("showWrongAnswersBtn");

    if (container.classList.contains("hidden")) {
        list.innerHTML = "";

        // Mostra il voto anche qui
        let votoHtml = `<div style=\"font-size:1.2em;font-weight:bold;margin-bottom:15px;\">Voto: ${lastEvaluation} <span style=\"color:#4facfe\">${lastEvaluationMessage}</span></div>`;
        list.innerHTML += votoHtml;

        if (wrongAnswers.length === 0) {
            list.innerHTML += "<p>Nessuna risposta sbagliata! 🎉</p>";
        } else {
            wrongAnswers.forEach((item, index) => {
                let html = `
                    <div class=\"wrong-answer-item\" style=\"margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;\">
                        <p><strong>Domanda ${index + 1}:</strong> ${item.question}</p>`;

                // Aggiungi immagine della domanda se presente
                if (item.questionImage) {
                    html += `<img src=\"${item.questionImage}\" style=\"max-width: 100%; max-height: 200px; margin: 10px 0; border-radius: 8px;\" alt="img error">`;
                }

                html += `<p style=\"color: #dc3545;\">❌ ${item.yourAnswer}</p>`;

                // Aggiungi immagine della risposta sbagliata se presente
                if (item.yourAnswerImage) {
                    html += `<img src=\"${item.yourAnswerImage}\" style=\"max-width: 100%; max-height: 150px; margin: 5px 0 10px 0; border-radius: 4px;\" alt="img error">`;
                }

                html += `<p style=\"color: #28a745;\">✅ ${item.correctAnswer}</p>`;

                // Aggiungi immagine della risposta corretta se presente
                if (item.correctAnswerImage) {
                    html += `<img src=\"${item.correctAnswerImage}\" style=\"max-width: 100%; max-height: 150px; margin: 5px 0 0 0; border-radius: 4px;\" alt="img error">`;
                }

                html += `</div>`;
                list.innerHTML += html;
            });
        }

        container.classList.remove("hidden");
        btn.textContent = "Nascondi Risposte Sbagliate";
    } else {
        container.classList.add("hidden");
        btn.textContent = "Mostra Risposte Sbagliate";
    }
}

// Carica tutti i quiz all'avvio
window.onload = () => {
    loadAllQuestions();
};
