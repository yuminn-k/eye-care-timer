let timer;
let timeLeft;
let isRunning = false;

// DOM 요소
const timeLeftDisplay = document.getElementById("timeLeft");
const statusDisplay = document.getElementById("status");
const startButton = document.getElementById("startTimer");
const resetButton = document.getElementById("resetTimer");
const workTimeInput = document.getElementById("workTime");
const breakTimeInput = document.getElementById("breakTime");
const debouncedUpdateTime = debounce(updateTime, 1000);

// 초기 상태 로드
chrome.storage.local.get(
  ["workTime", "breakTime", "isRunning", "isWorking"],
  (result) => {
    workTimeInput.value = result.workTime || 50;
    breakTimeInput.value = result.breakTime || 10;
    isRunning = result.isRunning || false;
    updateButtonState();
  }
);

// 타이머 시작/정지
startButton.addEventListener("click", () => {
  isRunning = !isRunning;
  chrome.storage.local.set({ isRunning });

  if (isRunning) {
    const workTime = parseInt(workTimeInput.value);
    const breakTime = parseInt(breakTimeInput.value);

    chrome.storage.local.set({
      workTime: workTime,
      breakTime: breakTime,
    });

    chrome.runtime.sendMessage({
      action: "startTimer",
      workTime: workTime,
      breakTime: breakTime,
    });
  } else {
    chrome.runtime.sendMessage({ action: "stopTimer" });
  }

  updateButtonState();
});

// 타이머 초기화
resetButton.addEventListener("click", () => {
  isRunning = false;
  chrome.storage.local.set({ isRunning });
  chrome.runtime.sendMessage({ action: "resetTimer" });
  updateButtonState();
});

// 버튼 상태 업데이트
function updateButtonState() {
  startButton.textContent = isRunning ? "정지" : "시작";
  startButton.style.backgroundColor = isRunning ? "#f44336" : "#4CAF50";
}

// 1초마다 시간 업데이트
function updateTime() {
  chrome.storage.local.get(["timeLeft", "isWorking"], (result) => {
    if (result.timeLeft !== undefined) {
      const minutes = Math.floor(result.timeLeft / 60);
      const seconds = result.timeLeft % 60;
      timeLeftDisplay.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      statusDisplay.textContent = result.isWorking ? "작업 시간" : "휴식 시간";
    }
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

setInterval(debouncedUpdateTime, 1000);
