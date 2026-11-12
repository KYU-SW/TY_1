console.log("EyeRest JavaScript 연결 성공");

/* =================================
   기본 요소
================================= */

const symptomIds = [
  "fatigue",
  "dryness",
  "blur",
  "discomfort"
];

const infoButtons =
  document.querySelectorAll(".info-button");

const checkButton =
  document.getElementById("checkButton");

const resultCard =
  document.getElementById("resultCard");

const statusBadge =
  document.getElementById("statusBadge");

const totalScoreElement =
  document.getElementById("totalScore");

const resultMessage =
  document.getElementById("resultMessage");

/*
 * 점수 입력 기준 안내
 */
const scaleGuideButton =
  document.getElementById(
    "scaleGuideButton"
  );

const scaleGuidePanel =
  document.getElementById(
    "scaleGuidePanel"
  );

/*
 * 이용 안내
 */
const usageGuideButton =
  document.getElementById(
    "usageGuideButton"
  );

const usageGuidePanel =
  document.getElementById(
    "usageGuidePanel"
  );

/* =================================
   슬라이더 값 표시
================================= */

symptomIds.forEach((id) => {
  const slider =
    document.getElementById(id);

  const valueElement =
    document.getElementById(
      `${id}Value`
    );

  if (!slider || !valueElement) {
    console.error(
      `${id} 입력 요소를 찾을 수 없습니다.`
    );

    return;
  }

  slider.addEventListener(
    "input",
    () => {
      valueElement.textContent =
        slider.value;
    }
  );
});

/* =================================
   증상 설명 툴팁
================================= */

function closeAllTooltips(
  exceptButton = null
) {
  infoButtons.forEach((button) => {
    if (button === exceptButton) {
      return;
    }

    const tooltipId =
      button.getAttribute(
        "aria-controls"
      );

    const tooltip =
      document.getElementById(
        tooltipId
      );

    button.classList.remove("active");

    button.setAttribute(
      "aria-expanded",
      "false"
    );

    tooltip?.classList.remove(
      "visible"
    );
  });
}

infoButtons.forEach((button) => {
  button.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      const tooltipId =
        button.getAttribute(
          "aria-controls"
        );

      const tooltip =
        document.getElementById(
          tooltipId
        );

      if (!tooltip) {
        return;
      }

      const isOpen =
        tooltip.classList.contains(
          "visible"
        );

      closeAllTooltips(button);

      button.classList.toggle(
        "active",
        !isOpen
      );

      button.setAttribute(
        "aria-expanded",
        String(!isOpen)
      );

      tooltip.classList.toggle(
        "visible",
        !isOpen
      );
    }
  );
});

/*
 * 툴팁 영역 밖을 누르면
 * 클릭으로 고정된 툴팁을 닫는다.
 */
document.addEventListener(
  "click",
  (event) => {
    const clickedInfoArea =
      event.target.closest(
        ".question-title"
      );

    if (!clickedInfoArea) {
      closeAllTooltips();
    }
  }
);

/*
 * Esc 키로 툴팁 닫기
 */
document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      closeAllTooltips();
    }
  }
);

/* =================================
   공통 접기·펼치기 함수
================================= */

function toggleGuidePanel(
  button,
  panel
) {
  if (!button || !panel) {
    return;
  }

  const isOpen =
    button.getAttribute(
      "aria-expanded"
    ) === "true";

  const nextOpenState =
    !isOpen;

  button.setAttribute(
    "aria-expanded",
    String(nextOpenState)
  );

  panel.hidden =
    !nextOpenState;

  const icon =
    button.querySelector(
      ".toggle-icon"
    );

  if (icon) {
    icon.textContent =
      nextOpenState
        ? "－"
        : "＋";
  }
}

/* =================================
   점수 입력 기준 펼치기
================================= */

scaleGuideButton?.addEventListener(
  "click",
  () => {
    closeAllTooltips();

    toggleGuidePanel(
      scaleGuideButton,
      scaleGuidePanel
    );
  }
);

/* =================================
   이용 안내 펼치기
================================= */

usageGuideButton?.addEventListener(
  "click",
  () => {
    closeAllTooltips();

    toggleGuidePanel(
      usageGuideButton,
      usageGuidePanel
    );
  }
);

/* =================================
   총점 계산
================================= */

function calculateTotalScore() {
  return symptomIds.reduce(
    (total, id) => {
      const slider =
        document.getElementById(id);

      if (!slider) {
        return total;
      }

      return (
        total +
        Number(slider.value)
      );
    },
    0
  );
}

/* =================================
   초기 프로토타입 불편 수준 요약
================================= */

function summarizeDiscomfort(
  totalScore
) {
  /*
   * 아래 구간은 의료적 진단 기준이 아니다.
   * 사용자 평가 전의 초기 규칙이다.
   */

  if (totalScore <= 5) {
    return {
      level:
        "현재 불편감 낮음",

      color:
        "#1ca7a6",

      message:
        "현재 입력한 불편감이 낮습니다. " +
        "원하는 작업시간을 선택하고 정기적으로 " +
        "눈을 쉬어 주세요."
    };
  }

  if (totalScore <= 12) {
    return {
      level:
        "현재 불편감 있음",

      color:
        "#f2a23a",

      message:
        "현재 일부 불편감이 입력되었습니다. " +
        "작업 전에 잠시 쉬거나 짧은 작업 주기를 " +
        "선택해 보세요."
    };
  }

  return {
    level:
      "현재 불편감 높음",

    color:
      "#e86f61",

    message:
      "현재 높은 불편감이 입력되었습니다. " +
      "작업을 시작하기 전에 화면에서 시선을 떼고 " +
      "잠시 쉬는 것을 우선 권장합니다."
  };
}

/* =================================
   입력 결과 확인
================================= */

checkButton.addEventListener(
  "click",
  () => {
    const totalScore =
      calculateTotalScore();

    const result =
      summarizeDiscomfort(
        totalScore
      );

    totalScoreElement.textContent =
      totalScore;

    statusBadge.textContent =
      result.level;

    statusBadge.style.backgroundColor =
      result.color;

    resultMessage.textContent =
      result.message;

    closeAllTooltips();

    resultCard.classList.remove(
      "hidden"
    );

    resultCard.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
);