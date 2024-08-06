let students = [];
let sections = {
    Foundation: { weeks: [] },
    Advanced: { weeks: [] }
};
let currentSection = 'Foundation';
let currentWeek = 0;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("uploadButton").addEventListener("click", handleFileUpload);
    document.getElementById("rankStudentsBtn").addEventListener("click", rankAndUpdateDashboard);
    document.getElementById("foundationWeekNumber").addEventListener("change", handleWeekChange);
    document.getElementById("advancedWeekNumber").addEventListener("change", handleWeekChange);
    document.getElementById("addWeek").addEventListener("click", addWeek);
    document.querySelector(".close").addEventListener("click", closeStudentDetailsModal);
    window.addEventListener("click", closeModalOnOutsideClick);
    updateDashboard();
});

function handleFileUpload() {
    const fileInput = document.getElementById("csvFileInput");
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => processCSV(e.target.result);
        reader.readAsText(file);
    } else {
        alert("Please select a CSV file to upload.");
    }
}

function processCSV(csv) {
    const lines = csv.split("\n");
    const headers = lines[0].split(",");
    
    students = [];
    sections = { Foundation: { weeks: [] }, Advanced: { weeks: [] } };

    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].split(",");
        if (currentLine.length === headers.length) {
            const [section, studentName, weekNumber, quizScore, labScore] = currentLine;
            
            if (!students.some(s => s.name === studentName)) {
                students.push({ name: studentName });
            }

            const weekIndex = parseInt(weekNumber);
            while (sections[section].weeks.length <= weekIndex) {
                sections[section].weeks.push({ students: [] });
            }

            const studentData = { 
                name: studentName, 
                quiz: parseInt(quizScore), 
                lab: parseInt(labScore) 
            };
            
            const studentIndex = sections[section].weeks[weekIndex].students.findIndex(s => s.name === studentName);
            if (studentIndex === -1) {
                sections[section].weeks[weekIndex].students.push(studentData);
            } else {
                sections[section].weeks[weekIndex].students[studentIndex] = studentData;
            }
        }
    }
    updateUI();
}

function updateUI() {
    updateWeekSelector();
    displayStudents();
    updateCharts();
    rankStudents();
    updateSupportNeededList();
    createPerformanceHeatmap();
}

function updateWeekSelector() {
    ['Foundation', 'Advanced'].forEach(section => {
        const selector = document.getElementById(`${section.toLowerCase()}WeekNumber`);
        selector.innerHTML = '';
        sections[section].weeks.forEach((_, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `Week ${index}`;
            selector.appendChild(option);
        });
    });
}

function displayStudents() {
    const traineeListContent = document.getElementById('traineeListContent');
    traineeListContent.innerHTML = '';
    
    ['Foundation', 'Advanced'].forEach(section => {
        const sectionHeader = document.createElement('h3');
        sectionHeader.textContent = section;
        sectionHeader.className = 'section-header';
        traineeListContent.appendChild(sectionHeader);

        const sectionWeeks = sections[section].weeks;
        const latestWeek = sectionWeeks[sectionWeeks.length - 1] || { students: [] };

        students.forEach(student => {
            const traineeItem = document.createElement('div');
            traineeItem.className = 'trainee-item';
            
            const avatar = createAvatar(student.name);
            const weekData = latestWeek.students.find(s => s.name === student.name) || { quiz: 0, lab: 0 };
            
            traineeItem.innerHTML = `
                <div class="trainee-name">
                    <div class="trainee-avatar" style="background-color: ${avatar.color}">${avatar.initials}</div>
                    ${student.name}
                </div>
                <input type="number" id="${section}-${student.name}-quiz" class="trainee-input quiz" min="0" max="100" value="${weekData.quiz}">
                <input type="number" id="${section}-${student.name}-lab" class="trainee-input lab" min="0" max="100" value="${weekData.lab}">
                <div class="action-buttons">
                    <button class="icon-btn view-details-btn" data-student="${student.name}" data-section="${section}" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="icon-btn export-chart-btn" data-student="${student.name}" data-section="${section}" title="Export Chart">
                        <i class="fas fa-file-export"></i>
                    </button>
                </div>
            `;
            
            traineeListContent.appendChild(traineeItem);
        });
    });

    addStudentButtonListeners();
}

function addStudentButtonListeners() {
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', function() {
            createStudentDetailsPage(this.dataset.student, this.dataset.section);
        });
    });

    document.querySelectorAll('.export-chart-btn').forEach(button => {
        button.addEventListener('click', function() {
            exportStudentChart(this.dataset.student, this.dataset.section);
        });
    });
}

function rankStudents() {
    ['Foundation', 'Advanced'].forEach(section => {
        const rankedStudents = students.map(student => {
            const latestWeek = sections[section].weeks[sections[section].weeks.length - 1];
            const studentData = latestWeek ? latestWeek.students.find(s => s.name === student.name) : null;
            return {
                name: student.name,
                quiz: studentData ? studentData.quiz : 0,
                lab: studentData ? studentData.lab : 0,
                total: studentData ? studentData.quiz + studentData.lab : 0
            };
        });

        rankedStudents.sort((a, b) => b.total - a.total);

        const rankedList = document.getElementById("rankedStudents");
        rankedList.innerHTML += `<h3>${section} Ranking</h3>`;

        rankedStudents.forEach((student, index) => {
            const priority = student.total >= 160 ? "high" : student.total >= 120 ? "medium" : "low";
            const priorityText = priority.charAt(0).toUpperCase() + priority.slice(1);

            rankedList.innerHTML += `
                <div class="student-row">
                    <div class="rank">${index + 1}</div>
                    <div class="avatar" style="background-color: ${getRandomColor()}">${getInitials(student.name)}</div>
                    <div class="student-name">${student.name}</div>
                    <div class="score">
                        <span class="score-label">Quiz</span>
                        <span class="score-value">${student.quiz}</span>
                    </div>
                    <div class="score">
                        <span class="score-label">Lab</span>
                        <span class="score-value">${student.lab}</span>
                    </div>
                    <div class="total-score">${student.total}</div>
                    <div class="priority">
                        <span class="priority-indicator priority-${priority}">${priorityText}</span>
                    </div>
                </div>
            `;
        });
    });
}

function updateCharts() {
    updateWeeklyCharts();
    updateStudentTrendCharts();
    setupExportButtons();
}

function updateWeeklyCharts() {
    ['Foundation', 'Advanced'].forEach(section => {
        const chartContainer = document.getElementById(`${section.toLowerCase()}WeeklyChart`);
        chartContainer.innerHTML = '<canvas></canvas>';
        const canvas = chartContainer.querySelector('canvas');
        const ctx = canvas.getContext('2d');

        const currentWeekData = sections[section].weeks[currentWeek] || { students: [] };

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: students.map(student => student.name),
                datasets: [
                    {
                        label: 'Quiz',
                        data: students.map(student => {
                            const studentData = currentWeekData.students.find(s => s.name === student.name);
                            return studentData ? studentData.quiz : 0;
                        }),
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    },
                    {
                        label: 'Lab',
                        data: students.map(student => {
                            const studentData = currentWeekData.students.find(s => s.name === student.name);
                            return studentData ? studentData.lab : 0;
                        }),
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `${section} - Week ${currentWeek} Performance`,
                    },
                },
            },
        });
    });
}

function updateStudentTrendCharts() {
    const chartsContainer = document.getElementById("studentTrendCharts");
    chartsContainer.innerHTML = "";

    students.forEach((student, index) => {
        ['Foundation', 'Advanced'].forEach(section => {
            const chartDiv = document.createElement("div");
            chartDiv.className = "chart-container";
            chartsContainer.appendChild(chartDiv);

            const canvas = document.createElement("canvas");
            chartDiv.appendChild(canvas);

            const ctx = canvas.getContext("2d");

            const studentData = sections[section].weeks.map(week => {
                const weekData = week.students.find(s => s.name === student.name);
                return weekData ? { quiz: weekData.quiz, lab: weekData.lab } : { quiz: 0, lab: 0 };
            });

            new Chart(ctx, {
                type: "line",
                data: {
                    labels: sections[section].weeks.map((_, index) => `Week ${index}`),
                    datasets: [
                        {
                            label: 'Quiz',
                            data: studentData.map(data => data.quiz),
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1
                        },
                        {
                            label: 'Lab',
                            data: studentData.map(data => data.lab),
                            borderColor: 'rgb(255, 99, 132)',
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${student.name}'s ${section} Performance Trend`,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    }
                }
            });
        });
    });
}

function createPerformanceHeatmap() {
    const ctx = document.getElementById('performanceHeatmap').getContext('2d');

    const heatmapData = [];
    let yIndex = 0;

    ['Foundation', 'Advanced'].forEach(section => {
        students.forEach((student) => {
            sections[section].weeks.forEach((week, weekIndex) => {
                const studentData = week.students.find(s => s.name === student.name);
                if (studentData) {
                    const averageScore = (studentData.quiz + studentData.lab) / 2;
                    heatmapData.push({
                        x: weekIndex,
                        y: yIndex,
                        v: averageScore,
                        section: section
                    });
                }
            });
            yIndex++;
        });
        // Add a gap between sections
        yIndex++;
    });

    new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: 'Student Performance',
                data: heatmapData,
                borderWidth: 1,
                borderColor: '#ffffff',
                backgroundColor: (context) => {
                    const value = context.dataset.data[context.dataIndex].v;
                    const alpha = value / 100;
                    return context.dataset.data[context.dataIndex].section === 'Foundation'
                        ? `rgba(0, 123, 255, ${alpha})`
                        : `rgba(255, 99, 132, ${alpha})`;
                },
                width: (context) => {
                    const chart = context.chart;
                    const barWidth = chart.width / Math.max(sections.Foundation.weeks.length, sections.Advanced.weeks.length);
                    return barWidth > 50 ? 50 : barWidth;
                },
                height: (context) => {
                    const chart = context.chart;
                    const barHeight = chart.height / (students.length * 2 + 1); // +1 for the gap between sections
                    return barHeight > 50 ? 50 : barHeight;
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (context) => {
                            const data = context[0].dataset.data[context[0].dataIndex];
                            const studentIndex = Math.floor(data.y / (students.length + 1));
                            const section = data.section;
                            return `${section} - ${students[studentIndex].name} - Week ${data.x}`;
                        },
                        label: (context) => `Score: ${context.raw.v.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: 0,
                    max: Math.max(sections.Foundation.weeks.length, sections.Advanced.weeks.length) - 1,
                    ticks: {
                        stepSize: 1,
                        callback: (value) => `Week ${value}`
                    },
                    title: { display: true, text: 'Weeks' }
                },
                y: {
                    type: 'linear',
                    min: 0,
                    max: students.length * 2,
                    ticks: {
                        stepSize: 1,
                        callback: (value) => {
                            if (value % (students.length + 1) === 0) {
                                return value === 0 ? 'Foundation' : 'Advanced';
                            }
                            const studentIndex = value % (students.length + 1) - 1;
                            return students[studentIndex] ? students[studentIndex].name : '';
                        }
                    },
                    title: { display: true, text: 'Students' }
                }
            }
        }
    });
}

function handleWeekChange(e) {
  currentSection = e.target.id.includes('foundation') ? 'Foundation' : 'Advanced';
  currentWeek = parseInt(e.target.value);
  updateUI();
}

function addWeek() {
  ['Foundation', 'Advanced'].forEach(section => {
      sections[section].weeks.push({
          students: students.map(student => ({
              name: student.name,
              quiz: 0,
              lab: 0
          }))
      });
  });
  updateUI();
}

function createStudentDetailsPage(studentName, section) {
  const student = students.find(s => s.name === studentName);
  if (!student) return;

  const studentData = sections[section].weeks.map(week => {
      const studentWeekData = week.students.find(s => s.name === studentName);
      return studentWeekData ? studentWeekData : { quiz: 0, lab: 0 };
  });

  const quizScores = studentData.map(data => data.quiz);
  const labScores = studentData.map(data => data.lab);

  const averageQuiz = quizScores.reduce((a, b) => a + b, 0) / quizScores.length;
  const averageLab = labScores.reduce((a, b) => a + b, 0) / labScores.length;
  const totalAverage = (averageQuiz + averageLab) / 2;

  const content = `
      <div class="student-header">
          <div class="trainee-avatar" style="background-color: ${createAvatar(student.name).color}">${createAvatar(student.name).initials}</div>
          <h2>${student.name}'s ${section} Performance Details</h2>
      </div>
      <div class="student-details">
          <div class="stats-card">
              <h3>Average Quiz Score</h3>
              <div class="stats-value">${averageQuiz.toFixed(1)}%</div>
          </div>
          <div class="stats-card">
              <h3>Average Lab Score</h3>
              <div class="stats-value">${averageLab.toFixed(1)}%</div>
          </div>
          <div class="stats-card">
              <h3>Total Average</h3>
              <div class="stats-value">${totalAverage.toFixed(1)}%</div>
          </div>
          <div class="stats-card">
              <h3>Ranking</h3>
              <div class="stats-value">#${getRanking(studentName, section)}</div>
          </div>
          <div class="chart-detail-container">
              <canvas id="studentDetailChart"></canvas>
          </div>
          <div class="weekly-scores">
              <h3>Weekly Scores</h3>
              <table>
                  <thead>
                      <tr>
                          <th>Week</th>
                          <th>Quiz Score</th>
                          <th>Lab Score</th>
                          <th>Total</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${studentData.map((data, index) => `
                          <tr>
                              <td>Week ${index}</td>
                              <td>${data.quiz}</td>
                              <td>${data.lab}</td>
                              <td>${data.quiz + data.lab}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
      </div>
      <button class="export-image" onclick="exportToImage('${studentName}', '${section}')">Export as Image</button>
  `;

  document.getElementById('studentDetailsContent').innerHTML = content;

  const ctx = document.getElementById('studentDetailChart').getContext('2d');
  new Chart(ctx, {
      type: 'line',
      data: {
          labels: sections[section].weeks.map((_, index) => `Week ${index}`),
          datasets: [
              {
                  label: 'Quiz',
                  data: quizScores,
                  borderColor: 'rgb(75, 192, 192)',
                  tension: 0.1
              },
              {
                  label: 'Lab',
                  data: labScores,
                  borderColor: 'rgb(255, 99, 132)',
                  tension: 0.1
              }
          ]
      },
      options: {
          responsive: true,
          plugins: {
              title: {
                  display: true,
                  text: `${student.name}'s ${section} Performance Trend`
              }
          },
          scales: {
              y: {
                  beginAtZero: true,
                  max: 100
              }
          }
      }
  });

  document.getElementById('studentDetailsModal').style.display = 'block';
}

function closeStudentDetailsModal() {
  document.getElementById('studentDetailsModal').style.display = 'none';
}

function closeModalOnOutsideClick(event) {
  if (event.target == document.getElementById('studentDetailsModal')) {
      closeStudentDetailsModal();
  }
}

function getInitials(name) {
  return name.split(' ').map(word => word[0].toUpperCase()).join('');
}

function getRandomColor() {
  return '#' + Math.floor(Math.random()*16777215).toString(16);
}

function createAvatar(name) {
  return {
      initials: getInitials(name),
      color: getRandomColor()
  };
}

function getRanking(studentName, section) {
  const rankedStudents = [...students].sort((a, b) => {
      const aTotal = sections[section].weeks.reduce((sum, week) => {
          const student = week.students.find(s => s.name === a.name);
          return sum + (student ? student.quiz + student.lab : 0);
      }, 0);
      const bTotal = sections[section].weeks.reduce((sum, week) => {
          const student = week.students.find(s => s.name === b.name);
          return sum + (student ? student.quiz + student.lab : 0);
      }, 0);
      return bTotal - aTotal;
  });
  return rankedStudents.findIndex(student => student.name === studentName) + 1;
}

function exportToImage(studentName, section) {
  const element = document.getElementById('studentDetailsContent');
  const exportButton = document.querySelector('.export-image');

  exportButton.textContent = 'Generating Image...';
  exportButton.disabled = true;

  element.classList.add('capturing');

  html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff'
  }).then(canvas => {
      element.classList.remove('capturing');

      const image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const link = document.createElement('a');
      link.download = `${studentName}_${section}_performance.png`;
      link.href = image;
      link.click();

      exportButton.textContent = 'Export as Image';
      exportButton.disabled = false;
  }).catch(error => {
      console.error('Error generating image:', error);
      alert('There was an error generating the image. Please try again.');

      exportButton.textContent = 'Export as Image';
      exportButton.disabled = false;
  });
}

function analyzeStudentPerformance() {
  const supportNeeded = [];
  const threshold = 60;
  const consistentLowPerformance = 3;

  ['Foundation', 'Advanced'].forEach(section => {
      students.forEach(student => {
          const performances = sections[section].weeks.map(week => {
              const studentData = week.students.find(s => s.name === student.name);
              return studentData ? (studentData.quiz + studentData.lab) / 2 : null;
          }).filter(score => score !== null);

          if (performances.length >= consistentLowPerformance) {
              const recentPerformances = performances.slice(-consistentLowPerformance);
              const averageScore = recentPerformances.reduce((sum, score) => sum + score, 0) / recentPerformances.length;
              const isDecreasing = recentPerformances.every((score, index, array) => 
                  index === 0 || score <= array[index - 1]);

              if (averageScore < threshold || isDecreasing) {
                  supportNeeded.push({
                      name: student.name,
                      section: section,
                      averageScore: averageScore.toFixed(2),
                      trend: isDecreasing ? 'Decreasing' : 'Low',
                      lastScore: performances[performances.length - 1].toFixed(2)
                  });
              }
          }
      });
  });

  return supportNeeded;
}

function updateSupportNeededList() {
  const supportNeeded = analyzeStudentPerformance();
  const supportNeededList = document.getElementById('supportNeededList');
  supportNeededList.innerHTML = '';

  if (supportNeeded.length === 0) {
      supportNeededList.innerHTML = '<p>No trainees currently need additional support.</p>';
      return;
  }

  supportNeeded.forEach(student => {
      const studentItem = document.createElement('div');
      studentItem.className = 'support-needed-item';
      studentItem.innerHTML = `
          <span class="support-needed-name">${student.name} (${student.section})</span>
          <span class="support-needed-score">Average: ${student.averageScore}</span>
          <span class="support-needed-score">Last Score: ${student.lastScore}</span>
          <span class="support-needed-trend trend-${student.trend.toLowerCase()}">${student.trend}</span>
      `;
      supportNeededList.appendChild(studentItem);
  });
}

function updateDashboard() {
  updateUI();
}

function rankAndUpdateDashboard() {
  rankStudents();
  updateDashboard();
}

// Initialize the dashboard
updateDashboard();