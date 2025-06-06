let questions = []; // verranno caricate o generate
let currentQuestionIndex = 0;
let score = 0;
let totalQuestions = 0;
let currentQuizType = ''; // 'diritto' o 'ium'
let wrongAnswers = []; // per tracciare le risposte sbagliate
let allQuestions = {
    diritto: [],
    ium: []
};

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
        fetch('Diritto.json').then(response => response.json()),
        fetch('Ium.json').then(response => response.json())
    ])
        .then(([dirittoData, iumData]) => {
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

function startRandomQuiz() {
    shuffleArray(questions);
    questions = questions.slice(0, 20);
    startQuiz();
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
    questionNumberEl.textContent = `Domanda ${currentQuestionIndex + 1} di ${totalQuestions}`;
    questionTextEl.textContent = q.quest;
    answersContainerEl.innerHTML = "";
    feedbackEl.classList.add("hidden");
    feedbackEl.textContent = "";

    q.answers.forEach((answer, index) => {
        const btn = document.createElement("div");
        btn.classList.add("answer-option");
        btn.textContent = answer.text;
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
            correctAnswer: q.answers[correct].text
        });
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

    document.getElementById("finalScore").textContent = `Punteggio: ${score}/${totalQuestions}`;
    document.getElementById("correctAnswers").textContent = score;
    document.getElementById("incorrectAnswers").textContent = totalQuestions - score;
    document.getElementById("accuracyPercentage").textContent = `${Math.round((score / totalQuestions) * 100)}%`;

    let message = "Ben fatto!";
    if (score < totalQuestions / 2) message = "Hai bisogno di ripassare.";
    else if (score === totalQuestions) message = "Perfetto!";
    document.getElementById("scoreMessage").textContent = message;
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

// Carica tutti i quiz all'avvio
window.onload = () => {
    loadAllQuestions();
};

function showWrongAnswers() {
    const container = document.getElementById("wrongAnswersContainer");
    const list = document.getElementById("wrongAnswersList");
    const btn = document.getElementById("showWrongAnswersBtn");

    if (container.classList.contains("hidden")) {
        list.innerHTML = "";

        if (wrongAnswers.length === 0) {
            list.innerHTML = "<p>Nessuna risposta sbagliata! 🎉</p>";
        } else {
            wrongAnswers.forEach((item, index) => {
                list.innerHTML += `
                    <div class="wrong-answer-item" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <p><strong>Domanda ${index + 1}:</strong> ${item.question}</p>
                        <p style="color: #dc3545;">❌ La tua risposta: ${item.yourAnswer}</p>
                        <p style="color: #28a745;">✅ Risposta corretta: ${item.correctAnswer}</p>
                    </div>
                `;
            });
        }

        container.classList.remove("hidden");
        btn.textContent = "Nascondi Risposte Sbagliate";
    } else {
        container.classList.add("hidden");
        btn.textContent = "Mostra Risposte Sbagliate";
    }
}
