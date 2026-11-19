"use strict";

const symptomIds = ["fatigue", "dryness", "blur", "discomfort"];
const REST_DURATION_MS = 20 * 1000;

const checkupCard = document.getElementById("checkupCard");
const checkButton = document.getElementById("checkButton");
const resultCard = document.getElementById("resultCard");
const statusBadge = document.getElementById("statusBadge");
const totalScoreElement = document.getElementById("totalScore");
const resultMessage = document.getElementById("resultMessage");
const timeOptionButtons = [...document.querySelectorAll(".time-option")];
const customWorkMinutes = document.getElementById("customWorkMinutes");
const applyCustomTimeButton = document.getElementById("applyCustomTimeButton");
const selectedWorkMinutesElement = document.getElementById("selectedWorkMinutes");
const timeSelectionError = document.getElementById("timeSelectionError");
const startSessionButton = document.getElementById("startSessionButton");

const workCard = document.getElementById("workCard");
const workTimer = document.getElementById("workTimer");
const workCycleLabel = document.getElementById("workCycleLabel");
const workProgress = document.getElementById("workProgress");
const workProgressFill = document.getElementById("workProgressFill");
const workStatus = document.getElementById("workStatus");
const pauseResumeButton = document.getElementById("pauseResumeButton");
const endSessionButton = document.getElementById("endSessionButton");

const breakCard = document.getElementById("breakCard");
const breakTimer = document.getElementById("breakTimer");
const breakStatus = document.getElementById("breakStatus");
const completeBreakButton = document.getElementById("completeBreakButton");
const postponeBreakButton = document.getElementById("postponeBreakButton");
const endSessionFromBreakButton = document.getElementById("endSessionFromBreakButton");

const sessionResultCard = document.getElementById("sessionResultCard");
const totalWorkTimeElement = document.getElementById("totalWorkTime");
const resultWorkMinutesElement = document.getElementById("resultWorkMinutes");
const resultCompletedBreaksElement = document.getElementById("resultCompletedBreaks");
const resultPostponedBreaksElement = document.getElementById("resultPostponedBreaks");
const completionRateElement = document.getElementById("completionRate");
const newSessionButton = document.getElementById("newSessionButton");
const liveStatus = document.getElementById("liveStatus");

const infoButtons = [...document.querySelectorAll(".info-button")];
const scaleGuideButton = document.getElementById("scaleGuideButton");
const scaleGuidePanel = document.getElementById("scaleGuidePanel");
const usageGuideButton = document.getElementById("usageGuideButton");
const usageGuidePanel = document.getElementById("usageGuidePanel");
const panelCloseButtons = [...document.querySelectorAll(".panel-close-button")];
const guideItems = [
  { button: scaleGuideButton, panel: scaleGuidePanel },
  { button: usageGuideButton, panel: usageGuidePanel }
];

let phase = "checkup";
let selectedWorkMinutes = 20;
let checkedScore = 0;
let timerIntervalId = null;
let workDeadline = null;
let breakDeadline = null;
let workRemainingMs = 0;
let sessionWorkMs = 0;
let activeWorkStartedAt = null;
let completedBreaks = 0;
let postponedBreaks = 0;

function formatTime(milliseconds, roundUp = false) {
  const totalSeconds = Math.max(
    0,
    roundUp ? Math.ceil(milliseconds / 1000) : Math.floor(milliseconds / 1000)
  );
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function clearTimerInterval() {
  if (timerIntervalId !== null) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function startTimerInterval() {
  clearTimerInterval();
  timerIntervalId = window.setInterval(updateTimer, 250);
}

function updateScoreLabel(id) {
  const slider = document.getElementById(id);
  const valueElement = document.getElementById(`${id}Value`);

  if (!slider || !valueElement) {
    return;
  }

  valueElement.textContent = slider.value;
  slider.setAttribute("aria-valuetext", `${slider.value}점`);
}

symptomIds.forEach((id) => {
  const slider = document.getElementById(id);
  if (!slider) return;

  updateScoreLabel(id);
  slider.addEventListener("input", () => updateScoreLabel(id));
});

function closeAllTooltips(exceptButton = null) {
  infoButtons.forEach((button) => {
    if (button === exceptButton) return;

    const tooltip = document.getElementById(button.getAttribute("aria-controls"));
    button.classList.remove("active");
    button.setAttribute("aria-expanded", "false");
    tooltip?.classList.remove("visible");
  });
}

infoButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const tooltip = document.getElementById(button.getAttribute("aria-controls"));
    if (!tooltip) return;

    const isOpen = tooltip.classList.contains("visible");
    closeAllTooltips(button);
    button.classList.toggle("active", !isOpen);
    button.setAttribute("aria-expanded", String(!isOpen));
    tooltip.classList.toggle("visible", !isOpen);
  });
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element) || !event.target.closest(".info-button")) {
    closeAllTooltips();
  }
});

function closeGuidePanel(button, panel) {
  if (!button || !panel) return;

  button.setAttribute("aria-expanded", "false");
  panel.hidden = true;
}

function closeAllGuidePanels(exceptPanel = null) {
  guideItems.forEach(({ button, panel }) => {
    if (panel === exceptPanel) return;
    closeGuidePanel(button, panel);
  });
}

function toggleGuidePanel(button, panel) {
  if (!button || !panel) return;

  const isOpen = button.getAttribute("aria-expanded") === "true";
  closeAllGuidePanels(panel);
  closeAllTooltips();
  button.setAttribute("aria-expanded", String(!isOpen));
  panel.hidden = isOpen;
}

scaleGuideButton?.addEventListener("click", () => toggleGuidePanel(scaleGuideButton, scaleGuidePanel));
usageGuideButton?.addEventListener("click", () => toggleGuidePanel(usageGuideButton, usageGuidePanel));

panelCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.dataset.closePanel);
    const guide = guideItems.find((item) => item.panel === panel);
    if (!guide) return;

    closeGuidePanel(guide.button, guide.panel);
    guide.button?.focus();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  closeAllTooltips();
  closeAllGuidePanels();
});

function calculateTotalScore() {
  return symptomIds.reduce((total, id) => {
    const slider = document.getElementById(id);
    return total + (slider ? Number(slider.value) : 0);
  }, 0);
}

function summarizeDiscomfort(score) {
  if (score <= 5) {
    return {
      level: "현재 불편감 낮음",
      className: "status-low",
      message: "현재 입력한 불편감이 낮습니다. 본인에게 편한 작업시간을 선택하고 필요할 때 눈을 쉬어 주세요."
    };
  }

  if (score <= 12) {
    return {
      level: "현재 불편감 있음",
      className: "status-medium",
      message: "현재 일부 불편감이 입력되었습니다. 작업을 시작하기 전에 잠시 쉬고, 짧은 작업시간을 선택할지 고려해 보세요."
    };
  }

  return {
    level: "현재 불편감 높음",
    className: "status-high",
    message: "현재 불편감이 높게 입력되었습니다. 작업을 시작하기 전에 화면에서 시선을 떼고 잠시 쉬는 것을 고려해 주세요."
  };
}

checkButton?.addEventListener("click", () => {
  checkedScore = calculateTotalScore();
  const result = summarizeDiscomfort(checkedScore);

  totalScoreElement.textContent = String(checkedScore);
  statusBadge.textContent = result.level;
  statusBadge.classList.remove("status-low", "status-medium", "status-high");
  statusBadge.classList.add(result.className);
  resultMessage.textContent = result.message;

  closeAllTooltips();
  closeAllGuidePanels();
  resultCard.hidden = false;
  liveStatus.textContent = `입력 결과를 확인했습니다. 총점 ${checkedScore}점, ${result.level}입니다.`;
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
});

function updateSelectedTime(minutes, clearCustomInput = false) {
  selectedWorkMinutes = minutes;
  selectedWorkMinutesElement.textContent = String(minutes);
  timeOptionButtons.forEach((button) => {
    const isSelected = Number(button.dataset.minutes) === minutes;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  if (clearCustomInput) {
    customWorkMinutes.value = "";
  }

  timeSelectionError.hidden = true;
  timeSelectionError.textContent = "";
}

timeOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    updateSelectedTime(Number(button.dataset.minutes), true);
  });
});

function applyCustomTime() {
  const rawValue = customWorkMinutes.value.trim();
  const minutes = Number(rawValue);

  if (rawValue === "" || !Number.isInteger(minutes) || minutes < 1 || minutes > 120) {
    timeSelectionError.textContent = "작업시간은 1~120분 사이의 정수로 입력해 주세요.";
    timeSelectionError.hidden = false;
    customWorkMinutes.focus();
    return;
  }

  updateSelectedTime(minutes);
  liveStatus.textContent = `작업시간을 ${minutes}분으로 설정했습니다.`;
}

applyCustomTimeButton?.addEventListener("click", applyCustomTime);
customWorkMinutes?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyCustomTime();
  }
});
customWorkMinutes?.addEventListener("input", () => {
  timeSelectionError.hidden = true;
});

function updateWorkDisplay() {
  workTimer.textContent = formatTime(workRemainingMs, true);
  workCycleLabel.textContent = `${selectedWorkMinutes}분`;

  const cycleMs = selectedWorkMinutes * 60 * 1000;
  const progress = Math.min(100, Math.max(0, ((cycleMs - workRemainingMs) / cycleMs) * 100));
  workProgressFill.style.width = `${progress}%`;
  workProgress.setAttribute("aria-valuenow", String(Math.round(progress)));
}

function updateSessionResults() {
  const totalResponses = completedBreaks + postponedBreaks;
  const completionRate = totalResponses === 0
    ? 0
    : Math.round((completedBreaks / totalResponses) * 100);

  totalWorkTimeElement.textContent = formatTime(sessionWorkMs);
  resultWorkMinutesElement.textContent = String(selectedWorkMinutes);
  resultCompletedBreaksElement.textContent = String(completedBreaks);
  resultPostponedBreaksElement.textContent = String(postponedBreaks);
  completionRateElement.textContent = `${completionRate}%`;
}

function recordActiveWorkSegment(endedAt = performance.now()) {
  if (activeWorkStartedAt === null) return;

  sessionWorkMs += Math.max(0, endedAt - activeWorkStartedAt);
  activeWorkStartedAt = null;
}

function renderWorkControls() {
  const isPaused = phase === "paused";
  pauseResumeButton.textContent = isPaused ? "계속하기" : "일시 정지";
  workStatus.textContent = isPaused
    ? "타이머가 일시 정지되어 있습니다."
    : "타이머가 진행되는 동안의 시간만 실제 작업시간에 합산됩니다.";
}

function beginWorkCycle() {
  phase = "work";
  workRemainingMs = selectedWorkMinutes * 60 * 1000;
  workDeadline = performance.now() + workRemainingMs;
  activeWorkStartedAt = performance.now();

  checkupCard.hidden = true;
  resultCard.hidden = true;
  breakCard.hidden = true;
  workCard.hidden = false;
  pauseResumeButton.textContent = "일시 정지";
  updateWorkDisplay();
  renderWorkControls();
  startTimerInterval();
  workCard.scrollIntoView({ behavior: "smooth", block: "start" });
  liveStatus.textContent = `작업 타이머를 시작했습니다. 선택한 작업시간은 ${selectedWorkMinutes}분입니다.`;
}

function beginSession() {
  sessionWorkMs = 0;
  completedBreaks = 0;
  postponedBreaks = 0;
  workDeadline = null;
  breakDeadline = null;
  activeWorkStartedAt = null;
  beginWorkCycle();
}

function beginBreak() {
  recordActiveWorkSegment();
  clearTimerInterval();
  phase = "break";
  workRemainingMs = 0;
  breakDeadline = performance.now() + REST_DURATION_MS;
  workCard.hidden = true;
  breakCard.hidden = false;
  completeBreakButton.disabled = true;
  completeBreakButton.textContent = "20초 휴식 중";
  breakStatus.textContent = "휴식 시간이 끝나면 완료를 기록할 수 있습니다.";
  updateBreakDisplay();
  startTimerInterval();
  breakCard.scrollIntoView({ behavior: "smooth", block: "start" });
  liveStatus.textContent = "작업 주기가 끝났습니다. 20초 동안 눈을 쉬어 주세요.";
}

function updateBreakDisplay() {
  const remainingMs = Math.max(0, breakDeadline - performance.now());
  breakTimer.textContent = formatTime(remainingMs, true);

  if (remainingMs === 0) {
    clearTimerInterval();
    completeBreakButton.disabled = false;
    completeBreakButton.textContent = "휴식 완료하고 계속 작업";
    breakStatus.textContent = "20초가 지났습니다. 휴식 완료를 기록하거나 연기할 수 있습니다.";
    liveStatus.textContent = "휴식 시간이 끝났습니다. 완료 또는 연기를 선택해 주세요.";
  }
}

function updateTimer() {
  if (phase === "work") {
    workRemainingMs = Math.max(0, workDeadline - performance.now());
    updateWorkDisplay();

    if (workRemainingMs === 0) {
      beginBreak();
    }
    return;
  }

  if (phase === "break") {
    updateBreakDisplay();
  }
}

function pauseOrResumeWork() {
  if (phase === "work") {
    const now = performance.now();
    workRemainingMs = Math.max(0, workDeadline - now);

    if (workRemainingMs === 0) {
      beginBreak();
      return;
    }

    recordActiveWorkSegment(now);
    phase = "paused";
    clearTimerInterval();
    updateWorkDisplay();
    renderWorkControls();
    liveStatus.textContent = "작업 타이머를 일시 정지했습니다.";
    return;
  }

  if (phase === "paused") {
    phase = "work";
    workDeadline = performance.now() + workRemainingMs;
    activeWorkStartedAt = performance.now();
    renderWorkControls();
    startTimerInterval();
    liveStatus.textContent = "작업 타이머를 다시 시작했습니다.";
  }
}

function finishBreak(wasCompleted) {
  if (phase !== "break") return;

  if (wasCompleted) {
    if (performance.now() < breakDeadline) return;
    completedBreaks += 1;
    liveStatus.textContent = "휴식 완료를 기록했습니다. 다음 작업 주기를 시작합니다.";
  } else {
    postponedBreaks += 1;
    liveStatus.textContent = "휴식을 연기했습니다. 다음 작업 주기를 시작합니다.";
  }

  clearTimerInterval();
  breakDeadline = null;
  beginWorkCycle();
}

function finishSession() {
  if (!["work", "paused", "break"].includes(phase)) return;

  if (phase === "work") {
    const now = performance.now();
    const remainingMs = Math.max(0, workDeadline - now);
    if (remainingMs === 0) {
      beginBreak();
      return;
    }
    recordActiveWorkSegment(now);
  }

  clearTimerInterval();
  phase = "complete";
  workDeadline = null;
  breakDeadline = null;
  activeWorkStartedAt = null;
  workCard.hidden = true;
  breakCard.hidden = true;
  updateSessionResults();
  sessionResultCard.hidden = false;
  sessionResultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  liveStatus.textContent = "세션을 종료했습니다. 이번 세션 결과를 확인해 주세요.";
}

function startNewSession() {
  clearTimerInterval();
  phase = "checkup";
  selectedWorkMinutes = 20;
  checkedScore = 0;
  workDeadline = null;
  breakDeadline = null;
  workRemainingMs = 0;
  sessionWorkMs = 0;
  activeWorkStartedAt = null;
  completedBreaks = 0;
  postponedBreaks = 0;

  symptomIds.forEach((id) => {
    const slider = document.getElementById(id);
    if (!slider) return;
    slider.value = "0";
    updateScoreLabel(id);
  });

  updateSelectedTime(20, true);
  checkupCard.hidden = false;
  resultCard.hidden = true;
  workCard.hidden = true;
  breakCard.hidden = true;
  sessionResultCard.hidden = true;
  statusBadge.classList.remove("status-low", "status-medium", "status-high");
  closeAllTooltips();
  closeAllGuidePanels();
  window.scrollTo({ top: 0, behavior: "smooth" });
  checkupCard.querySelector("input[type='range']")?.focus({ preventScroll: true });
  liveStatus.textContent = "새 세션을 시작할 수 있습니다.";
}

startSessionButton?.addEventListener("click", beginSession);
pauseResumeButton?.addEventListener("click", pauseOrResumeWork);
endSessionButton?.addEventListener("click", finishSession);
endSessionFromBreakButton?.addEventListener("click", finishSession);
completeBreakButton?.addEventListener("click", () => finishBreak(true));
postponeBreakButton?.addEventListener("click", () => finishBreak(false));
newSessionButton?.addEventListener("click", startNewSession);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) updateTimer();
});

console.log("EyeRest 타이머와 세션 기능을 준비했습니다.");
