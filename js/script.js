let students = [];
let weeks = [];
let currentWeek = 0;

document
  .getElementById("uploadButton")
  .addEventListener("click", handleFileUpload);

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

  // Clear existing data
  students = [];
  weeks = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(",");
    if (currentLine.length === headers.length) {
      const studentName = currentLine[0];
      const weekNumber = parseInt(currentLine[1]);
      const quizScore = parseInt(currentLine[2]);
      const labScore = parseInt(currentLine[3]);

      // Add student if not exists
      if (!students.some((s) => s.name === studentName)) {
        students.push({ name: studentName });
      }

      // Add week if not exists
      while (weeks.length <= weekNumber) {
        weeks.push({ students: [] });
      }

      // Update student data for the week
      const weekIndex = weekNumber;
      const studentIndex = weeks[weekIndex].students.findIndex(
        (s) => s.name === studentName
      );
      if (studentIndex === -1) {
        weeks[weekIndex].students.push({
          name: studentName,
          quiz: quizScore,
          lab: labScore,
        });
      } else {
        weeks[weekIndex].students[studentIndex] = {
          name: studentName,
          quiz: quizScore,
          lab: labScore,
        };
      }
    }
  }

  // Set current week to the latest week
  currentWeek = weeks.length - 1;

  // Update UI
  updateWeekSelector();
  displayStudents();
  loadWeekData();
  updateCharts();
  rankStudents();
}

// Load students from JSON file
fetch("js/trainees.json")
  .then((response) => response.json())
  .then((data) => {
    students = data;
    displayStudents();
    updateWeekSelector();
  });

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
        `;
    studentList.appendChild(studentDiv);
  });
}

function updateWeekSelector() {
    const weekSelector = document.getElementById('weekNumber');
    weekSelector.innerHTML = '';
    for (let i = 0; i < weeks.length; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Week ${i}`;
        weekSelector.appendChild(option);
    }
    weekSelector.value = currentWeek;
}

document.getElementById('addWeek').addEventListener('click', () => {
    weeks.push({
        students: students.map(student => ({...student, quiz: 0, lab: 0}))
    });
    currentWeek = weeks.length - 1;
    updateWeekSelector();
    loadWeekData();
});

document.getElementById('weekNumber').addEventListener('change', (e) => {
    currentWeek = parseInt(e.target.value);
    loadWeekData();
    updateCharts();
});

function loadWeekData() {
    const weekData = weeks[currentWeek];
    if (weekData) {
        const inputs = document.querySelectorAll('#studentList input');
        students.forEach((student, index) => {
            const weekStudent = weekData.students.find(s => s.name === student.name);
            inputs[index * 2].value = weekStudent ? weekStudent.quiz : 0;
            inputs[index * 2 + 1].value = weekStudent ? weekStudent.lab : 0;
        });
    } else {
        // Clear inputs if no data for this week
        const inputs = document.querySelectorAll('#studentList input');
        inputs.forEach(input => input.value = '0');
    }
}

function rankStudents() {
  const inputs = document.querySelectorAll("#studentList input");
  const rankedStudents = [...students];

  rankedStudents.forEach((student, index) => {
    student.quiz = parseInt(inputs[index * 2].value) || 0;
    student.lab = parseInt(inputs[index * 2 + 1].value) || 0;
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

  // Update the current week's data
  weeks[currentWeek - 1] = {
    students: students.map((student) => ({ ...student })),
  };

  updateCharts();
}

document.getElementById("rankStudents").addEventListener("click", rankStudents);

function updateCharts() {
    updateWeeklyChart();
    updateStudentTrendCharts();
}

function updateWeeklyChart() {
  const chartContainer = document.getElementById("weeklyChart");
  chartContainer.innerHTML = "<canvas></canvas>";
  const ctx = chartContainer.querySelector("canvas").getContext("2d");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: students.map((student) => student.name),
      datasets: [
        {
          label: "Quiz",
          data: students.map((student) => student.quiz),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
        {
          label: "Lab",
          data: students.map((student) => student.lab),
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

function updateTrendChart() {
  const chartContainer = document.getElementById("trendChart");
  chartContainer.innerHTML = "<canvas></canvas>";
  const ctx = chartContainer.querySelector("canvas").getContext("2d");

  const averageScores = weeks.map(calculateAverageScores);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: weeks.map((_, index) => `Week ${index}`),
      datasets: [
        {
          label: "Average Quiz Score",
          data: averageScores.map((score) => score.quizAvg),
          borderColor: "rgb(75, 192, 192)",
          tension: 0.1,
        },
        {
          label: "Average Lab Score",
          data: averageScores.map((score) => score.labAvg),
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
          text: "Performance Trends Across Weeks",
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
}

function updateStudentTrendCharts() {
  const chartsContainer = document.getElementById("studentTrendCharts");
  chartsContainer.innerHTML = ""; // Clear previous charts

  students.forEach((student) => {
    const chartDiv = document.createElement("div");
    chartDiv.className = "chart-container";
    chartsContainer.appendChild(chartDiv);

    const canvas = document.createElement("canvas");
    chartDiv.appendChild(canvas);

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

function calculateAverageScores(weekData) {
  const totalStudents = weekData.students.length;
  const quizSum = weekData.students.reduce(
    (sum, student) => sum + student.quiz,
    0
  );
  const labSum = weekData.students.reduce(
    (sum, student) => sum + student.lab,
    0
  );
  return {
    quizAvg: quizSum / totalStudents,
    labAvg: labSum / totalStudents,
  };
}
