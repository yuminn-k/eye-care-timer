let isWorking = true;
let workTime = 50;
let breakTime = 10;

let timer;
let timeLeft;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    workTime: workTime,
    breakTime: breakTime,
    isRunning: false,
    isWorking: true,
  });
});

function createAlarm() {
  const minutes = isWorking ? workTime : breakTime;
  chrome.alarms.create("eyeCareTimer", {
    delayInMinutes: minutes,
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "eyeCareTimer") {
    isWorking = !isWorking;

    chrome.notifications.create({
      type: "basic",
      iconUrl: "../icons/icon128.png",
      title: isWorking ? "휴식 시간 종료!" : "작업 시간 종료!",
      message: isWorking ? "작업을 다시 시작하세요." : "눈을 쉬게 해주세요!",
    });

    createAlarm();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startTimer") {
    try {
      workTime = parseInt(message.workTime);
      breakTime = parseInt(message.breakTime);

      if (!validateTimeSettings(workTime, breakTime)) {
        throw new Error('Invalid time settings');
      }

      timeLeft = isWorking ? workTime * 60 : breakTime * 60;
      timer = setInterval(() => {
        timeLeft--;
        chrome.storage.local.set({ timeLeft, isWorking });

        if (timeLeft <= 0) {
          clearInterval(timer);
          createAlarm();
        }
      }, 1000);
    } catch (error) {
      console.error('Time error:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../icons/icon128.png',
        title: '설정 오류',
        message: '올바른 시간 값을 입력해주세요.',
      });
    }
  }
  } else if (message.action === "stopTimer") {
    clearInterval(timer);
  } else if (message.action === "resetTimer") {
    clearInterval(timer);
    timeLeft = workTime * 60;
    isWorking = true;
    chrome.storage.local.set({ timeLeft, isWorking });
  }
});

function validateTimeSettings(workTime, breakTime) {
  if (workTime < 1 || workTime > 120) return false;
  if (breakTime < 1 || breakTime > 30) return false;
  return true;
}
