// script.test.js

import "@testing-library/jest-dom";
import * as scriptFunctions from "./script.js";

// Mock Canvas
class CanvasRenderingContext2D {}

global.HTMLCanvasElement.prototype.getContext = function () {
  return new CanvasRenderingContext2D();
};

// Mock Chart.js
global.Chart = class {
  constructor() {
    this.destroy = jest.fn();
    this.update = jest.fn();
  }
  static register = jest.fn();
};

// Mock html2canvas
jest.mock(
  "html2canvas",
  () => jest.fn(() => Promise.resolve({ toDataURL: jest.fn() })),
  { virtual: true }
);

describe("Trainee Dashboard Tests", () => {
  beforeEach(() => {
    // Reset global variables
    global.students = [{ name: "John Doe" }, { name: "Jane Smith" }];
    global.weeks = [
      { students: [] },
      {
        students: [
          { name: "John Doe", quiz: 80, lab: 90 },
          { name: "Jane Smith", quiz: 85, lab: 95 },
        ],
      },
    ];
    global.currentWeek = 1;

    // Set up DOM elements
    document.body.innerHTML = `
        <div id="weekNumber"></div>
        <div id="traineeListContent"></div>
        <div id="rankedStudents"></div>
        <div id="weeklyChart"><canvas></canvas></div>
        <div id="studentTrendCharts"></div>
        <div id="studentDetailsModal"></div>
        <div id="studentDetailsContent"></div>
        <div id="supportNeededList"></div>
      `;

    // Create input elements for each student
    const traineeListContent = document.getElementById("traineeListContent");
    global.students.forEach((student) => {
      const studentDiv = document.createElement("div");
      studentDiv.innerHTML = `
          <input id="${student.name}-quiz" type="number" value="0">
          <input id="${student.name}-lab" type="number" value="0">
        `;
      traineeListContent.appendChild(studentDiv);
    });

    // Mock global functions
    global.alert = jest.fn();
  });

  test("processCSV parses CSV data correctly", () => {
    const csv = `Name,Week,Quiz,Lab
John Doe,1,80,90
Jane Smith,1,85,95`;
    scriptFunctions.processCSV(csv);
    expect(global.students).toHaveLength(2);
    expect(global.weeks).toHaveLength(2); // Week 0 and Week 1
    expect(global.students[0].name).toBe("John Doe");
    expect(global.weeks[1].students[0].quiz).toBe(80);
  });

  test("updateWeekSelector populates week dropdown", () => {
    global.weeks = [{}, {}, {}]; // 3 weeks
    scriptFunctions.updateWeekSelector();
    const weekSelector = document.getElementById("weekNumber");
    expect(weekSelector.children).toHaveLength(3);
    expect(weekSelector.children[1].textContent).toBe("Week 1");
  });

  test("displayStudents renders student list", () => {
    global.students = [{ name: "John Doe" }, { name: "Jane Smith" }];
    scriptFunctions.displayStudents();
    const traineeList = document.getElementById("traineeListContent");
    expect(traineeList.children).toHaveLength(2);
    expect(traineeList.innerHTML).toContain("John Doe");
    expect(traineeList.innerHTML).toContain("Jane Smith");
  });

  test("loadWeekData populates student scores", () => {
    global.students = [{ name: "John Doe" }, { name: "Jane Smith" }];
    global.weeks = [
      null,
      {
        students: [
          { name: "John Doe", quiz: 80, lab: 90 },
          { name: "Jane Smith", quiz: 85, lab: 95 },
        ],
      },
    ];
    global.currentWeek = 1;
    scriptFunctions.loadWeekData();
    expect(document.getElementById("John Doe-quiz").value).toBe("80");
    expect(document.getElementById("Jane Smith-lab").value).toBe("95");
  });

  test("rankStudents sorts students correctly", () => {
    global.students = [{ name: "John Doe" }, { name: "Jane Smith" }];
    document.getElementById("John Doe-quiz").value = "80";
    document.getElementById("John Doe-lab").value = "90";
    document.getElementById("Jane Smith-quiz").value = "85";
    document.getElementById("Jane Smith-lab").value = "95";
    scriptFunctions.rankStudents();
    const rankedList = document.getElementById("rankedStudents");
    expect(rankedList.innerHTML.indexOf("Jane Smith")).toBeLessThan(
      rankedList.innerHTML.indexOf("John Doe")
    );
  });

  test("updateWeeklyChart creates a new Chart instance", () => {
    scriptFunctions.updateWeeklyChart();
    expect(require("chart.js").Chart).toHaveBeenCalled();
  });

  test("handleWeekChange updates currentWeek", () => {
    // Set up the initial state
    global.currentWeek = 0;
    global.weeks = [{}, {}, {}, {}]; // 4 weeks of data

    // Mock the functions called by handleWeekChange
    const mockLoadWeekData = jest
      .spyOn(scriptFunctions, "loadWeekData")
      .mockImplementation(() => {});
    const mockUpdateCharts = jest
      .spyOn(scriptFunctions, "updateCharts")
      .mockImplementation(() => {});

    const event = { target: { value: "2" } };
    scriptFunctions.handleWeekChange(event);

    // Check if the global variable was updated
    expect(global.currentWeek).toBe(2);

    // Check if the mocked functions were called
    expect(mockLoadWeekData).toHaveBeenCalled();
    expect(mockUpdateCharts).toHaveBeenCalled();

    // Clean up
    mockLoadWeekData.mockRestore();
    mockUpdateCharts.mockRestore();
  });

  test("addWeek increases week count", () => {
    global.weeks = [{}, {}];
    scriptFunctions.addWeek();
    expect(global.weeks).toHaveLength(3);
  });

  test("getInitials returns correct initials", () => {
    expect(scriptFunctions.getInitials("John Doe")).toBe("JD");
    expect(scriptFunctions.getInitials("Alice Bob Charlie")).toBe("ABC");
  });

  test("getRandomColor returns a valid hex color", () => {
    const color = scriptFunctions.getRandomColor();
    expect(color).toMatch(/^#[0-9A-F]{6}$/i);
  });

  test("createAvatar returns correct avatar object", () => {
    const avatar = scriptFunctions.createAvatar("John Doe");
    expect(avatar.initials).toBe("JD");
    expect(avatar.color).toMatch(/^#[0-9A-F]{6}$/i);
  });


  test("updateDashboard updates the dashboard", () => {
    // Mock any global functions that might be called
    global.updateCharts = jest.fn();
    global.updateSupportNeededList = jest.fn();

    // Spy on DOM manipulation methods
    const spy = jest.spyOn(document, "getElementById");

    // Call updateDashboard
    scriptFunctions.updateDashboard();

    // Log what was called
    console.log("updateCharts called:", global.updateCharts.mock.calls.length);
    console.log(
      "updateSupportNeededList called:",
      global.updateSupportNeededList.mock.calls.length
    );
    console.log(
      "DOM elements accessed:",
      spy.mock.calls.map((call) => call[0])
    );

    // Check if any updates happened
    expect(spy).toHaveBeenCalled();

    // Clean up
    spy.mockRestore();
  });
});
