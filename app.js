// ==========================================
// 1. BULUT VERİTABANI AYARLARI (JSONBin.io)
// ==========================================
// jsonbin.io üzerinden aldığın bilgileri buraya gir:
const BIN_ID = "6a948d12f5f4af5e29557ada";
const API_KEY = "$2a$10$0.LXNuIj8NCBQnOClJCJWeSu0rvhSOfw0RzHRJIsfQWRGigFbcxku";

// ==========================================
// 2. 20 KADEMELİ ÖDÜL VE BARAJ PİRAMİDİ
// ==========================================
const PRIZE_LADDER = [
  { level: 1, prize: 500, checkpoint: false },
  { level: 2, prize: 1000, checkpoint: false },
  { level: 3, prize: 2000, checkpoint: false },
  { level: 4, prize: 3000, checkpoint: false },
  { level: 5, prize: 5000, checkpoint: true },   // 1. Baraj
  { level: 6, prize: 10000, checkpoint: false },
  { level: 7, prize: 20000, checkpoint: false },
  { level: 8, prize: 35000, checkpoint: false },
  { level: 9, prize: 50000, checkpoint: false },
  { level: 10, prize: 100000, checkpoint: true }, // 2. Baraj
  { level: 11, prize: 150000, checkpoint: false },
  { level: 12, prize: 250000, checkpoint: false },
  { level: 13, prize: 350000, checkpoint: false },
  { level: 14, prize: 500000, checkpoint: false },
  { level: 15, prize: 1000000, checkpoint: true }, // 3. Baraj (1 Milyon)
  { level: 16, prize: 1500000, checkpoint: false },
  { level: 17, prize: 2000000, checkpoint: false },
  { level: 18, prize: 2750000, checkpoint: false },
  { level: 19, prize: 3500000, checkpoint: false },
  { level: 20, prize: 5000000, checkpoint: true }  // 5 Milyon Büyük Final
];

// Oyun Durumu (State)
let currentLevel = 1;
let currentQuestion = null;
let playerName = "Anonim";
let timerInterval = null;
let timeLeft = 30;
let isAnswerLocked = false;
let doubleChanceActive = false;
let doubleChanceUsedCount = 0;

// DOM Elemanları
const startModal = document.getElementById("start-modal");
const startBtn = document.getElementById("start-btn");
const nameInput = document.getElementById("player-name-input");
const moneyLadderUl = document.getElementById("money-ladder");

const questionCat = document.getElementById("question-category");
const questionText = document.getElementById("question-text");
const optionBtns = document.querySelectorAll(".option-btn");

const timerText = document.getElementById("timer-text");
const timerBar = document.getElementById("timer-bar");

const resultModal = document.getElementById("result-modal");
const resultTitle = document.getElementById("result-title");
const resultMessage = document.getElementById("result-message");
const finalScoreDisplay = document.getElementById("final-score-display");
const restartBtn = document.getElementById("restart-btn");
const walkawayBtn = document.getElementById("walkaway-btn");

// Joker Butonları
const jokerFifty = document.getElementById("joker-fifty");
const jokerAudience = document.getElementById("joker-audience");
const jokerDouble = document.getElementById("joker-double");
const jokerPass = document.getElementById("joker-pass");

// Liderlik Modalı
const leaderboardModal = document.getElementById("leaderboard-modal");
const viewLeaderboardBtn = document.getElementById("view-leaderboard-btn");
const modalLeaderboardBtn = document.getElementById("modal-leaderboard-btn");
const closeLeaderboardBtn = document.getElementById("close-leaderboard-btn");

function init() {
  renderLadder();
  setupEventListeners();
}

function renderLadder() {
  moneyLadderUl.innerHTML = "";
  [...PRIZE_LADDER].reverse().forEach(item => {
    const li = document.createElement("li");
    li.id = `ladder-level-${item.level}`;
    if (item.checkpoint) li.classList.add("checkpoint");
    li.innerHTML = `<span>${item.level}. Soru</span> <span>${item.prize.toLocaleString("tr-TR")} P</span>`;
    moneyLadderUl.appendChild(li);
  });
}

function setupEventListeners() {
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", () => {
    resultModal.classList.add("hidden");
    startModal.classList.remove("hidden");
  });

  walkawayBtn.addEventListener("click", handleWalkaway);

  optionBtns.forEach(btn => {
    btn.addEventListener("click", () => handleAnswer(parseInt(btn.dataset.index)));
  });

  // Jokerler
  jokerFifty.addEventListener("click", useFiftyJoker);
  jokerAudience.addEventListener("click", useAudienceJoker);
  jokerDouble.addEventListener("click", useDoubleJoker);
  jokerPass.addEventListener("click", usePassJoker);

  // Liderlik Butonları
  viewLeaderboardBtn.addEventListener("click", () => showLeaderboard(false));
  modalLeaderboardBtn.addEventListener("click", () => showLeaderboard(true));
  closeLeaderboardBtn.addEventListener("click", () => leaderboardModal.classList.add("hidden"));
  document.getElementById("close-audience-btn").addEventListener("click", () => {
    document.getElementById("audience-modal").classList.add("hidden");
  });
}

function startGame() {
  playerName = nameInput.value.trim() || "Yarışmacı";
  startModal.classList.add("hidden");
  currentLevel = 1;
  resetJokers();
  loadQuestion();
}

function resetJokers() {
  [jokerFifty, jokerAudience, jokerDouble, jokerPass].forEach(btn => {
    btn.disabled = false;
  });
  doubleChanceActive = false;
  doubleChanceUsedCount = 0;
}

function loadQuestion() {
  isAnswerLocked = false;
  doubleChanceActive = false;
  doubleChanceUsedCount = 0;

  document.querySelectorAll("#money-ladder li").forEach(li => li.classList.remove("active"));
  const activeLi = document.getElementById(`ladder-level-${currentLevel}`);
  if (activeLi) activeLi.classList.add("active");

  const pool = QUESTION_BANK[currentLevel];
  currentQuestion = pool[Math.floor(Math.random() * pool.length)];

  questionCat.textContent = currentQuestion.category;
  questionText.textContent = currentQuestion.question;

  optionBtns.forEach((btn, idx) => {
    btn.className = "option-btn";
    btn.querySelector(".opt-text").textContent = currentQuestion.options[idx];
    btn.disabled = false;
  });

  startTimer();
}

function startTimer() {
  clearInterval(timerInterval);

  if (currentLevel <= 5) timeLeft = 30;
  else if (currentLevel <= 10) timeLeft = 40;
  else if (currentLevel <= 15) timeLeft = 50;
  else timeLeft = 0; // 16-20 seviyelerde limitsiz süre

  if (timeLeft === 0) {
    timerText.textContent = "∞";
    timerBar.style.width = "100%";
    return;
  }

  const initialTime = timeLeft;
  timerText.textContent = timeLeft;
  timerBar.style.width = "100%";

  timerInterval = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft;
    timerBar.style.width = `${(timeLeft / initialTime) * 100}%`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeOut();
    }
  }, 1000);
}

function handleAnswer(selectedIndex) {
  if (isAnswerLocked) return;
  const selectedBtn = optionBtns[selectedIndex];

  if (doubleChanceActive) {
    if (selectedIndex === currentQuestion.correct) {
      clearInterval(timerInterval);
      isAnswerLocked = true;
      selectedBtn.classList.add("correct");
      setTimeout(proceedToNextLevel, 1500);
    } else {
      selectedBtn.classList.add("wrong");
      selectedBtn.disabled = true;
      doubleChanceUsedCount++;
      if (doubleChanceUsedCount >= 2) {
        clearInterval(timerInterval);
        isAnswerLocked = true;
        showCorrectAndFail();
      }
    }
    return;
  }

  clearInterval(timerInterval);
  isAnswerLocked = true;
  selectedBtn.classList.add("selected");

  setTimeout(() => {
    if (selectedIndex === currentQuestion.correct) {
      selectedBtn.classList.remove("selected");
      selectedBtn.classList.add("correct");
      setTimeout(proceedToNextLevel, 1500);
    } else {
      selectedBtn.classList.remove("selected");
      selectedBtn.classList.add("wrong");
      showCorrectAndFail();
    }
  }, 1200);
}

function showCorrectAndFail() {
  optionBtns[currentQuestion.correct].classList.add("correct");
  setTimeout(() => {
    endGame(calculateGuaranteedScore(), "Yanlış Cevap Verildi!");
  }, 1500);
}

function handleTimeOut() {
  isAnswerLocked = true;
  optionBtns[currentQuestion.correct].classList.add("correct");
  setTimeout(() => {
    endGame(calculateGuaranteedScore(), "Süreniz Doldu!");
  }, 1200);
}

function proceedToNextLevel() {
  if (currentLevel === 20) {
    endGame(5000000, "🏆 TEBRİKLER! 5.000.000 PUANLA ZİRVE ŞAMPİYONU OLDUNUZ!");
    return;
  }
  currentLevel++;
  loadQuestion();
}

function handleWalkaway() {
  if (isAnswerLocked) return;
  clearInterval(timerInterval);
  const earned = currentLevel === 1 ? 0 : PRIZE_LADDER[currentLevel - 2].prize;
  endGame(earned, "Yarışmadan Çekildiniz.");
}

function calculateGuaranteedScore() {
  if (currentLevel > 15) return PRIZE_LADDER[14].prize; // 3. Baraj: 1.000.000
  if (currentLevel > 10) return PRIZE_LADDER[9].prize;  // 2. Baraj: 100.000
  if (currentLevel > 5) return PRIZE_LADDER[4].prize;   // 1. Baraj: 5.000
  return 0;
}

function endGame(finalScore, title) {
  saveGlobalScore(playerName, finalScore);
  resultTitle.textContent = title;
  finalScoreDisplay.textContent = `${finalScore.toLocaleString("tr-TR")} P`;
  resultModal.classList.remove("hidden");
}

/* --- Joker Fonksiyonları --- */
function useFiftyJoker() {
  jokerFifty.disabled = true;
  let wrongIndices = [0, 1, 2, 3].filter(i => i !== currentQuestion.correct);
  wrongIndices.sort(() => 0.5 - Math.random());
  wrongIndices.slice(0, 2).forEach(idx => {
    optionBtns[idx].classList.add("hidden-opt");
  });
}

function useAudienceJoker() {
  jokerAudience.disabled = true;
  const correct = currentQuestion.correct;
  let votes = [0, 0, 0, 0];
  votes[correct] = Math.floor(Math.random() * 30) + 45;
  let remaining = 100 - votes[correct];

  const others = [0, 1, 2, 3].filter(i => i !== correct);
  others.forEach((idx, i) => {
    if (i === others.length - 1) {
      votes[idx] = remaining;
    } else {
      const share = Math.floor(Math.random() * remaining);
      votes[idx] = share;
      remaining -= share;
    }
  });

  const barsContainer = document.getElementById("audience-bars");
  const labels = ["A", "B", "C", "D"];
  barsContainer.innerHTML = votes.map((pct, idx) => `
    <div class="bar-col">
      <span style="font-size:0.75rem;">%${pct}</span>
      <div class="bar-fill" style="height:${pct * 1.2}px;"></div>
      <strong>${labels[idx]}</strong>
    </div>
  `).join("");

  document.getElementById("audience-modal").classList.remove("hidden");
}

function useDoubleJoker() {
  jokerDouble.disabled = true;
  doubleChanceActive = true;
}

function usePassJoker() {
  jokerPass.disabled = true;
  const pool = QUESTION_BANK[currentLevel];
  const remaining = pool.filter(q => q.question !== currentQuestion.question);
  currentQuestion = remaining[Math.floor(Math.random() * remaining.length)];

  questionCat.textContent = currentQuestion.category;
  questionText.textContent = currentQuestion.question;
  optionBtns.forEach((btn, idx) => {
    btn.className = "option-btn";
    btn.querySelector(".opt-text").textContent = currentQuestion.options[idx];
    btn.disabled = false;
  });
  startTimer();
}

// ==============================================================
// 3. CANLI & ORTAK BULUT LİDERLİK TABLOSU (GLOBAL TOP 10)
// ==============================================================
async function saveGlobalScore(name, score) {
  if (score <= 0) return;
  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": API_KEY }
    });
    const data = await response.json();
    let scores = Array.isArray(data.record) ? data.record : [];

    const newEntry = {
      name: name,
      score: score,
      date: new Date().toLocaleDateString("tr-TR")
    };

    scores.push(newEntry);
    scores.sort((a, b) => b.score - a.score);
    const top10 = scores.slice(0, 10);

    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
      },
      body: JSON.stringify(top10)
    });
  } catch (error) {
    console.error("Bulut skoru kaydedilemedi:", error);
  }
}

async function showLeaderboard(fromResult = false) {
  const tbody = document.querySelector("#leaderboard-table tbody");
  tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Skorlar buluttan alınıyor...</td></tr>";
  leaderboardModal.classList.remove("hidden");

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: { "X-Master-Key": API_KEY }
    });
    const data = await response.json();
    const scores = Array.isArray(data.record) ? data.record : [];

    tbody.innerHTML = "";
    if (scores.length === 0) {
      tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Henüz liderlik tablosunda skor yok.</td></tr>";
    } else {
      scores.forEach((entry, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${idx + 1}</strong></td>
          <td>${entry.name}</td>
          <td style="color:var(--accent-gold); font-weight:700;">${entry.score.toLocaleString("tr-TR")} P</td>
          <td>${entry.date}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  } catch (error) {
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center; color:#e74c3c;'>Liderlik tablosuna bağlanılamadı.</td></tr>";
    console.error("Bulut skorları alınamadı:", error);
  }
}

// Oyunu Başlat
init();