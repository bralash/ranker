let students = [];
let weeks = [];
let currentWeek = 0;

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("uploadButton")
    .addEventListener("click", handleFileUpload);
  document
    .getElementById("rankStudents")
    .addEventListener("click", rankStudents);
  document
    .getElementById("weekNumber")
    .addEventListener("change", handleWeekChange);
  document.getElementById("addWeek").addEventListener("click", addWeek);
});

// File Upload Handling
function handleFileUpload() {
  const fileInput = document.getElementById("csvFileInput");
  const file = fileInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const csv = e.target.result;
      processCSV(csv);
    };
    reader.readAsText(file);
  } else {
    alert("Please select a CSV file to upload.");
  }
}

function processCSV(csv) {
  const lines = csv.split("\n");
  const headers = lines[0].split(",");

  students = [];
  weeks = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(",");
    if (currentLine.length === headers.length) {
      const [studentName, weekNumber, quizScore, labScore] = currentLine;

      if (!students.some((s) => s.name === studentName)) {
        students.push({ name: studentName });
      }

      while (weeks.length <= parseInt(weekNumber)) {
        weeks.push({ students: [] });
      }

      const weekIndex = parseInt(weekNumber);
      const studentIndex = weeks[weekIndex].students.findIndex(
        (s) => s.name === studentName
      );
      const studentData = {
        name: studentName,
        quiz: parseInt(quizScore),
        lab: parseInt(labScore),
      };

      if (studentIndex === -1) {
        weeks[weekIndex].students.push(studentData);
      } else {
        weeks[weekIndex].students[studentIndex] = studentData;
      }
    }
  }

  currentWeek = weeks.length - 1;
  updateUI();
}

// UI Updates
function updateUI() {
  updateWeekSelector();
  displayStudents();
  loadWeekData();
  updateCharts();
  rankStudents();
}

function updateWeekSelector() {
  const weekSelector = document.getElementById("weekNumber");
  weekSelector.innerHTML = "";
  for (let i = 0; i < weeks.length; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `Week ${i}`;
    weekSelector.appendChild(option);
  }
  weekSelector.value = currentWeek;
}

function displayStudents() {
  const studentList = document.getElementById("studentList");
  studentList.innerHTML = "";
  students.forEach((student) => {
    const studentDiv = document.createElement("div");
    studentDiv.className = "student";
    studentDiv.innerHTML = `
          <h3>${student.name}</h3>
          <label for="${student.name}-quiz">Quiz:</label>
          <input type="number" id="${student.name}-quiz" class="quiz" min="0" max="100" value="0">
          <label for="${student.name}-lab">Lab:</label>
          <input type="number" id="${student.name}-lab" class="lab" min="0" max="100" value="0">
          <button class="view-details-btn" data-student="${student.name}">View Details</button>
      `;
    studentList.appendChild(studentDiv);
  });

  // Add event listeners for the new "View Details" buttons
  document.querySelectorAll(".view-details-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const studentName = this.dataset.student;
      createStudentDetailsPage(studentName);
    });
  });
}

function loadWeekData() {
  const weekData = weeks[currentWeek];
  if (weekData) {
    students.forEach((student) => {
      const weekStudent = weekData.students.find(
        (s) => s.name === student.name
      );
      document.getElementById(`${student.name}-quiz`).value = weekStudent
        ? weekStudent.quiz
        : 0;
      document.getElementById(`${student.name}-lab`).value = weekStudent
        ? weekStudent.lab
        : 0;
    });
  } else {
    students.forEach((student) => {
      document.getElementById(`${student.name}-quiz`).value = 0;
      document.getElementById(`${student.name}-lab`).value = 0;
    });
  }
}

// Ranking
function rankStudents() {
  const rankedStudents = students.map((student) => ({
    name: student.name,
    quiz: parseInt(document.getElementById(`${student.name}-quiz`).value) || 0,
    lab: parseInt(document.getElementById(`${student.name}-lab`).value) || 0,
    total: 0,
  }));

  rankedStudents.forEach((student) => {
    student.total = student.quiz + student.lab;
  });

  rankedStudents.sort((a, b) => b.total - a.total);

  const rankedList = document.getElementById("rankedStudents");
  rankedList.innerHTML = "<h2>Ranked Students</h2>";
  rankedStudents.forEach((student, index) => {
    rankedList.innerHTML += `
            <p>${index + 1}. ${student.name}: Quiz - ${student.quiz}, Lab - ${student.lab}, Total - ${student.total}</p>
        `;
  });

  weeks[currentWeek] = { students: rankedStudents };
  updateCharts();
}

// Chart Updates
function updateCharts() {
  updateWeeklyChart();
  updateStudentTrendCharts();
  setupExportButtons();
}

function updateWeeklyChart() {
  const chartContainer = document.getElementById("weeklyChart");
  chartContainer.innerHTML =
    '<canvas></canvas><button class="export-btn" data-chart="weekly">Export Weekly Chart</button>';
  const canvas = chartContainer.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: students.map((student) => student.name),
      datasets: [
        {
          label: "Quiz",
          data: students.map(
            (student) =>
              parseInt(document.getElementById(`${student.name}-quiz`).value) ||
              0
          ),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: "Lab",
          data: students.map(
            (student) =>
              parseInt(document.getElementById(`${student.name}-lab`).value) ||
              0
          ),
          backgroundColor: "rgba(255, 99, 132, 0.6)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Week ${currentWeek} Performance`,
        },
      },
    },
  });
}

function updateStudentTrendCharts() {
  const chartsContainer = document.getElementById("studentTrendCharts");
  chartsContainer.innerHTML = "";

  students.forEach((student, index) => {
    const chartDiv = document.createElement("div");
    chartDiv.className = "chart-container";
    chartsContainer.appendChild(chartDiv);

    const canvas = document.createElement("canvas");
    chartDiv.appendChild(canvas);

    const exportBtn = document.createElement("button");
    exportBtn.className = "export-btn";
    exportBtn.textContent = `Export ${student.name}'s Chart`;
    exportBtn.dataset.chart = `student-${index}`;
    chartDiv.appendChild(exportBtn);

    const ctx = canvas.getContext("2d");

    const studentData = weeks.map((week) => {
      const studentWeekData = week.students.find(
        (s) => s.name === student.name
      );
      return {
        quiz: studentWeekData ? studentWeekData.quiz : 0,
        lab: studentWeekData ? studentWeekData.lab : 0,
      };
    });

    new Chart(ctx, {
      type: "line",
      data: {
        labels: weeks.map((_, index) => `Week ${index}`),
        datasets: [
          {
            label: "Quiz",
            data: studentData.map((data) => data.quiz),
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
          {
            label: "Lab",
            data: studentData.map((data) => data.lab),
            borderColor: "rgb(255, 99, 132)",
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${student.name}'s Performance Trend`,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
          },
        },
      },
    });
  });
}

// Chart Export
function setupExportButtons() {
  document.querySelectorAll(".export-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const chartId = this.dataset.chart;
      let canvas;
      if (chartId === "weekly") {
        canvas = document.querySelector("#weeklyChart canvas");
      } else {
        const studentIndex = chartId.split("-")[1];
        canvas = document.querySelectorAll("#studentTrendCharts canvas")[
          studentIndex
        ];
      }

      const image = canvas.toDataURL("image/png");

      const tmpLink = document.createElement("a");
      tmpLink.download = `${chartId}-chart.png`;
      tmpLink.href = image;
      document.body.appendChild(tmpLink);
      tmpLink.click();
      document.body.removeChild(tmpLink);
    });
  });
}

// Week Management
function handleWeekChange(e) {
  currentWeek = parseInt(e.target.value);
  loadWeekData();
  updateCharts();
}

function addWeek() {
  weeks.push({
    students: students.map((student) => ({
      name: student.name,
      quiz: 0,
      lab: 0,
    })),
  });
  currentWeek = weeks.length - 1;
  updateWeekSelector();
  loadWeekData();
  updateCharts();
}

function createStudentDetailsPage(studentName) {
  const student = students.find((s) => s.name === studentName);
  if (!student) return;

  const studentData = weeks.map((week) => {
    const studentWeekData = week.students.find((s) => s.name === studentName);
    return studentWeekData ? studentWeekData : { quiz: 0, lab: 0 };
  });

  const quizScores = studentData.map((data) => data.quiz);
  const labScores = studentData.map((data) => data.lab);

  const averageQuiz = quizScores.reduce((a, b) => a + b, 0) / quizScores.length;
  const averageLab = labScores.reduce((a, b) => a + b, 0) / labScores.length;

  const strengths = [];
  const areasForImprovement = [];

  if (averageQuiz > averageLab) {
    strengths.push("Quiz performance");
    areasForImprovement.push("Lab performance");
  } else if (averageLab > averageQuiz) {
    strengths.push("Lab performance");
    areasForImprovement.push("Quiz performance");
  }

  if (quizScores[quizScores.length - 1] > averageQuiz) {
    strengths.push("Recent quiz improvement");
  } else {
    areasForImprovement.push("Recent quiz performance");
  }

  if (labScores[labScores.length - 1] > averageLab) {
    strengths.push("Recent lab improvement");
  } else {
    areasForImprovement.push("Recent lab performance");
  }

  const content = `
      <h2>${student.name}'s Performance Details</h2>
      <h3>Performance History</h3>
      <canvas id="studentDetailChart"></canvas>
      <h3>Overall Statistics</h3>
      <p>Average Quiz Score: ${averageQuiz.toFixed(2)}</p>
      <p>Average Lab Score: ${averageLab.toFixed(2)}</p>
      <h3>Strengths</h3>
      <ul>
          ${strengths.map((strength) => `<li>${strength}</li>`).join("")}
      </ul>
      <h3>Areas for Improvement</h3>
      <ul>
          ${areasForImprovement.map((area) => `<li>${area}</li>`).join("")}
      </ul>
  `;

  document.getElementById("studentDetailsContent").innerHTML = content;

  const ctx = document.getElementById("studentDetailChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: weeks.map((_, index) => `Week ${index}`),
      datasets: [
        {
          label: "Quiz",
          data: quizScores,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
        {
          label: "Lab",
          data: labScores,
          borderColor: "rgb(255, 99, 132)",
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `${student.name}'s Performance Trend`,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
        },
      },
    },
  });

  document.getElementById("studentDetailsModal").style.display = "block";
}

function closeStudentDetailsModal() {
  document.getElementById("studentDetailsModal").style.display = "none";
}

// Add this to your existing displayStudents function

// Add these event listeners when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // ... (existing event listeners)

  // Close the modal when clicking on <span> (x)
  document
    .querySelector(".close")
    .addEventListener("click", closeStudentDetailsModal);

  // Close the modal when clicking outside of it
  window.addEventListener("click", function (event) {
    if (event.target == document.getElementById("studentDetailsModal")) {
      closeStudentDetailsModal();
    }
  });
});
