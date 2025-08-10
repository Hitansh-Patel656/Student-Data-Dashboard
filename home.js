class StudentDashboard {
  constructor() {
    this.students = [];
    this.incorrectStudents = [];
    this.filteredStudents = [];
    this.selectedStudents = new Set();
    this.currentView = "table";
    this.sortConfig = { key: null, direction: "asc" };
    this.charts = {};

    this.loadDataFromLocalStorage();
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // File upload
    const uploadArea = document.getElementById("uploadArea");
    const fileInput = document.getElementById("fileInput");
    const addFileBtn = document.getElementById("addFileBtn");

    uploadArea.addEventListener("click", () => fileInput.click());
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("dragover");
    });
    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("dragover");
    });
    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    // New button to add file
    if (addFileBtn) {
      addFileBtn.addEventListener("click", () => fileInput.click());
    }

    // New Add Student Button
    document.getElementById("addStudentBtn").addEventListener("click", () => {
      this.showAddStudentModal();
    });
    document
      .getElementById("cancelAddStudentBtn")
      .addEventListener("click", () => {
        this.hideAddStudentModal();
      });
    document
      .getElementById("saveNewStudentBtn")
      .addEventListener("click", () => {
        this.saveNewStudent();
      });
    document
      .getElementById("addStudentModal")
      .addEventListener("click", (e) => {
        if (e.target.id === "addStudentModal") {
          this.hideAddStudentModal();
        }
      });

    // Search
    document.getElementById("searchInput").addEventListener("input", (e) => {
      this.applyFilters();
    });

    // View modes
    document.querySelectorAll(".view-mode").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.switchView(e.target.dataset.view);
      });
    });

    // Filters
    ["branchFilter", "yearFilter"].forEach((id) => {
      document.getElementById(id).addEventListener("change", () => {
        this.applyFilters();
      });
    });

    // Action buttons
    document.getElementById("selectAllBtn").addEventListener("click", () => {
      this.toggleSelectAll();
    });

    document.getElementById("emailBtn").addEventListener("click", () => {
      this.showEmailModal();
    });

    document.getElementById("exportBtn").addEventListener("click", () => {
      this.exportData();
    });

    document.getElementById("clearFiltersBtn").addEventListener("click", () => {
      this.clearFilters();
    });

    // Table sorting
    document.querySelectorAll("th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        this.sortData(th.dataset.sort);
      });
    });

    // Select all checkbox
    document
      .getElementById("selectAllCheckbox")
      .addEventListener("change", (e) => {
        this.toggleSelectAll();
      });

    // Email Modal events
    document.getElementById("cancelEmailBtn").addEventListener("click", () => {
      this.hideEmailModal();
    });

    document.getElementById("sendEmailBtn").addEventListener("click", () => {
      this.sendEmail();
    });

    document.getElementById("emailModal").addEventListener("click", (e) => {
      if (e.target.id === "emailModal") {
        this.hideEmailModal();
      }
    });

    // Profile Modal events
    document
      .getElementById("cancelProfileBtn")
      .addEventListener("click", () => {
        this.hideProfileModal();
      });

    document.getElementById("saveProfileBtn").addEventListener("click", () => {
      this.saveProfile();
    });

    document.getElementById("profileModal").addEventListener("click", (e) => {
      if (e.target.id === "profileModal") {
        this.hideProfileModal();
      }
    });

    // Validation Modal events
    document
      .getElementById("viewIncorrectBtn")
      .addEventListener("click", () => {
        this.showIncorrectEntriesModal();
      });
    document
      .getElementById("closeIncorrectEntriesBtn")
      .addEventListener("click", () => {
        this.hideIncorrectEntriesModal();
      });
    document
      .getElementById("incorrectEntriesModal")
      .addEventListener("click", (e) => {
        if (e.target.id === "incorrectEntriesModal") {
          this.hideIncorrectEntriesModal();
        }
      });

    this.initialRender();
  }

  initialRender() {
    if (this.students.length > 0 || this.incorrectStudents.length > 0) {
      this.showControls(true);
      this.updateStats();
      this.populateFilters();
      this.applyFilters();
      this.showNoData(false);
      this.showUploadArea(false);
      this.updateValidationSummary();
    } else {
      this.showNoData(true);
      this.showControls(false);
      this.showUploadArea(true);
    }
  }

  loadDataFromLocalStorage() {
    try {
      const students = localStorage.getItem("students");
      const incorrectStudents = localStorage.getItem("incorrectStudents");
      if (students) {
        this.students = JSON.parse(students);
      }
      if (incorrectStudents) {
        this.incorrectStudents = JSON.parse(incorrectStudents);
      }
    } catch (e) {
      console.error("Could not load data from local storage", e);
    }
  }

  saveDataToLocalStorage() {
    try {
      localStorage.setItem("students", JSON.stringify(this.students));
      localStorage.setItem(
        "incorrectStudents",
        JSON.stringify(this.incorrectStudents)
      );
    } catch (e) {
      console.error("Could not save data to local storage", e);
    }
  }

  async handleFileUpload(file) {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert("Please select a valid Excel file (.xlsx or .xls)");
      return;
    }

    this.showLoading(true);

    try {
      const data = await this.readExcelFile(file);
      this.processStudentData(data);
      this.saveDataToLocalStorage();
      this.showControls(true);
      this.updateStats();
      this.populateFilters();
      this.applyFilters();
      this.showNoData(false);
      this.showUploadArea(false);
      this.updateValidationSummary();
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Error reading file. Please make sure it's a valid Excel file.");
    } finally {
      this.showLoading(false);
    }
  }

  showUploadArea(show) {
    document.getElementById("uploadArea").classList.toggle("hidden", !show);
    document
      .getElementById("addFileBtnContainer")
      .classList.toggle("hidden", show);
  }

  updateValidationSummary() {
    const summaryDiv = document.getElementById("validationSummary");
    const correctCount = document.getElementById("correctEntriesCount");
    const incorrectCount = document.getElementById("incorrectEntriesCount");

    correctCount.textContent = this.students.length;
    incorrectCount.textContent = this.incorrectStudents.length;

    summaryDiv.style.display = "block";

    if (this.incorrectStudents.length > 0) {
      document.getElementById("viewIncorrectBtn").style.display =
        "inline-block";
    } else {
      document.getElementById("viewIncorrectBtn").style.display = "none";
    }
  }

  readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  processStudentData(rawData) {
    // Map of year words to numbers
    const yearMap = {
      first: 1,
      second: 2,
      third: 3,
      fourth: 4,
      fifth: 5,
    };

    this.students = [];
    this.incorrectStudents = [];

    rawData.forEach((row, index) => {
      let student = {
        id: index + 1,
        name: row.Name || row.name || `Student ${index + 1}`,
        branch: row.Branch || row.branch || "Unknown",
        year: row.Year || row.year || 1,
        email: row.Email || row.email || "",
        interests: (row.Interests || row.interests || "")
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== ""),
        phone: row.Phone || row.phone || "",
        gpa: parseFloat(
          row.GPA || row.gpa || (Math.random() * 2 + 2).toFixed(2)
        ),
        projects: row.Projects || row.projects || Math.floor(Math.random() * 5),
        skills: row.Skills || row.skills || "Programming",
        status: row.Status || row.status || "Active",
      };

      if (typeof student.year === "string") {
        student.year = student.year.toLowerCase();
        student.year = yearMap[student.year] || parseInt(student.year, 10);
      }

      const validationResult = this.validateStudent(student);
      if (validationResult.isValid) {
        this.students.push(student);
      } else {
        student.validationErrors = validationResult.errors;
        this.incorrectStudents.push(student);
      }
    });
  }

  validateStudent(student) {
    const errors = {};
    let isValid = true;

    const popularSkills = [
      "web dev",
      "cybersecurity",
      "dsa",
      "cloud",
      "ai/ml",
      "blockchain",
      "robotics",
      "app dev",
    ];

    // Regex to check for non-English characters
    const nonEnglishRegex = /[^\u0000-\u007F]+/;

    // Name validation
    if (
      !student.name ||
      typeof student.name !== "string" ||
      student.name.trim() === ""
    ) {
      errors.name = "Name cannot be empty.";
      isValid = false;
    } else if (nonEnglishRegex.test(student.name)) {
      errors.name = "Name must be in English.";
      isValid = false;
    }

    // Branch validation
    if (
      !student.branch ||
      typeof student.branch !== "string" ||
      student.branch.trim() === ""
    ) {
      errors.branch = "Branch cannot be empty.";
      isValid = false;
    } else if (nonEnglishRegex.test(student.branch)) {
      errors.branch = "Branch name must be in English.";
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!student.email || !emailRegex.test(student.email)) {
      errors.email = "Invalid email format.";
      isValid = false;
    }

    // GPA validation
    if (isNaN(student.gpa) || student.gpa < 0 || student.gpa > 4) {
      errors.gpa = "GPA must be a number between 0 and 4.";
      isValid = false;
    }

    // Year validation
    if (isNaN(student.year) || student.year < 1 || student.year > 5) {
      errors.year = "Year must be a number between 1 and 5.";
      isValid = false;
    }

    // Interests validation (check if at least one popular skill is present)
    const hasPopularSkill = student.interests.some((interest) =>
      popularSkills.some((skill) => interest.toLowerCase().includes(skill))
    );
    if (student.interests.length > 0 && !hasPopularSkill) {
      errors.interests =
        "Interests must include at least one popular skill (e.g., Web Dev, AI/ML).";
      isValid = false;
    }

    return { isValid, errors };
  }

  showAddStudentModal() {
    this.clearFormErrors("newStudentForm");
    document.getElementById("addStudentModal").classList.add("show");
  }

  hideAddStudentModal() {
    this.clearFormErrors("newStudentForm");
    document.getElementById("addStudentModal").classList.remove("show");
    document.getElementById("newStudentForm").reset();
  }

  saveNewStudent() {
    const newStudent = {
      id: this.students.length + this.incorrectStudents.length + 1,
      name: document.getElementById("newStudentName").value,
      branch: document.getElementById("newStudentBranch").value,
      year: parseInt(document.getElementById("newStudentYear").value),
      email: document.getElementById("newStudentEmail").value,
      gpa: parseFloat(document.getElementById("newStudentGPA").value),
      interests: document
        .getElementById("newStudentInterests")
        .value.split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== ""),
      phone: "",
      projects: 0,
      skills: "",
      status: "Active",
    };

    const validationResult = this.validateStudent(newStudent);
    if (validationResult.isValid) {
      this.students.push(newStudent);
      this.hideAddStudentModal();
      this.saveDataToLocalStorage();
      alert(`New student ${newStudent.name} added successfully!`);
      this.updateStats();
      this.populateFilters();
      this.applyFilters();
      this.updateValidationSummary();
    } else {
      this.clearFormErrors("newStudentForm");
      for (const key in validationResult.errors) {
        const input = document.getElementById(
          "newStudent" + key.charAt(0).toUpperCase() + key.slice(1)
        );
        if (input) {
          input.classList.add("error");
          const errorDiv = document.createElement("div");
          errorDiv.className = "error-message";
          errorDiv.textContent = validationResult.errors[key];
          input.parentElement.appendChild(errorDiv);
        } else if (key === "interests") {
          const interestsTextarea = document.getElementById(
            "newStudentInterests"
          );
          interestsTextarea.classList.add("error");
          const errorDiv = document.createElement("div");
          errorDiv.className = "error-message";
          errorDiv.textContent = validationResult.errors[key];
          interestsTextarea.parentElement.appendChild(errorDiv);
        }
      }
    }
  }

  clearFormErrors(formId) {
    const form = document.getElementById(formId);
    form.querySelectorAll(".error-message").forEach((el) => el.remove());
    form
      .querySelectorAll(".error")
      .forEach((el) => el.classList.remove("error"));
  }

  showLoading(show) {
    document.getElementById("loading").style.display = show ? "block" : "none";
  }

  showControls(show) {
    document.getElementById("searchControls").style.display = show
      ? "grid"
      : "none";
    document.getElementById("filtersRow").style.display = show
      ? "grid"
      : "none";
    document.getElementById("statsGrid").style.display = show ? "grid" : "none";
  }

  showNoData(show) {
    document.getElementById("noData").style.display = show ? "block" : "none";
  }

  updateStats() {
    if (this.students.length === 0) {
      document.getElementById("totalStudents").textContent = 0;
      document.getElementById("avgGPA").textContent = 0.0;
      document.getElementById("totalBranches").textContent = 0;
      document.getElementById("activeStudents").textContent = 0;
      return;
    }

    const totalStudents = this.students.length;
    const avgGPA = (
      this.students.reduce((sum, s) => sum + s.gpa, 0) / totalStudents
    ).toFixed(2);
    const totalBranches = new Set(this.students.map((s) => s.branch)).size;
    const activeStudents = this.students.filter(
      (s) => s.status === "Active"
    ).length;

    document.getElementById("totalStudents").textContent = totalStudents;
    document.getElementById("avgGPA").textContent = avgGPA;
    document.getElementById("totalBranches").textContent = totalBranches;
    document.getElementById("activeStudents").textContent = activeStudents;
  }

  populateFilters() {
    // Branches
    const branches = [...new Set(this.students.map((s) => s.branch))].sort();
    const branchFilter = document.getElementById("branchFilter");
    branchFilter.innerHTML = '<option value="">All Branches</option>';
    branches.forEach((branch) => {
      branchFilter.innerHTML += `<option value="${branch}">${branch}</option>`;
    });

    // Years
    const years = [...new Set(this.students.map((s) => s.year))].sort();
    const yearFilter = document.getElementById("yearFilter");
    yearFilter.innerHTML = '<option value="">All Years</option>';
    years.forEach((year) => {
      yearFilter.innerHTML += `<option value="${year}">Year ${year}</option>`;
    });
  }

  applyFilters() {
    const searchTerm = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const branchFilter = document.getElementById("branchFilter").value;
    const yearFilter = document.getElementById("yearFilter").value;

    this.filteredStudents = this.students.filter((student) => {
      const matchesSearch =
        !searchTerm ||
        Object.values(student).some((value) =>
          String(value).toLowerCase().includes(searchTerm)
        );
      const matchesBranch = !branchFilter || student.branch === branchFilter;
      const matchesYear = !yearFilter || String(student.year) === yearFilter;

      return matchesSearch && matchesBranch && matchesYear;
    });

    this.applySorting();
    this.renderCurrentView();
    this.updateSelectedCount();
  }

  applySorting() {
    if (!this.sortConfig.key) return;

    this.filteredStudents.sort((a, b) => {
      const aValue = a[this.sortConfig.key];
      const bValue = b[this.sortConfig.key];

      if (aValue < bValue) return this.sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return this.sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  sortData(key) {
    this.sortConfig = {
      key,
      direction:
        this.sortConfig.key === key && this.sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    };

    // Update sort indicators
    document.querySelectorAll(".sort-indicator").forEach((indicator) => {
      indicator.textContent = "";
    });

    const currentIndicator = document.querySelector(
      `th[data-sort="${key}"] .sort-indicator`
    );
    currentIndicator.textContent =
      this.sortConfig.direction === "asc" ? "↑" : "↓";

    this.applyFilters();
  }

  switchView(view) {
    this.currentView = view;

    // Update active button
    document.querySelectorAll(".view-mode").forEach((btn) => {
      btn.classList.remove("active");
    });
    document.querySelector(`[data-view="${view}"]`).classList.add("active");

    this.renderCurrentView();
  }

  renderCurrentView() {
    // Hide all views
    document.getElementById("tableView").classList.add("hidden");
    document.getElementById("cardsView").classList.add("hidden");
    document.getElementById("analyticsView").classList.add("hidden");

    // Show current view
    switch (this.currentView) {
      case "table":
        document.getElementById("tableView").classList.remove("hidden");
        this.renderTable();
        break;
      case "cards":
        document.getElementById("cardsView").classList.remove("hidden");
        this.renderCards();
        break;
      case "analytics":
        document.getElementById("analyticsView").classList.remove("hidden");
        this.renderAnalytics();
        break;
    }
  }

  renderTable() {
    const tbody = document.getElementById("studentTableBody");
    const searchTerm = document
      .getElementById("searchInput")
      .value.toLowerCase();

    tbody.innerHTML = this.filteredStudents
      .map(
        (student) => `
              <tr style="cursor: pointer;" onclick="dashboard.showProfileModal(${
                student.id
              })" class="${
          this.selectedStudents.has(student.id) ? "selected-row" : ""
        }" data-id="${student.id}">
                  <td>
                    <input type="checkbox" 
                    ${this.selectedStudents.has(student.id) ? "checked" : ""} 
                    onclick="event.stopPropagation()"
                    onchange="dashboard.toggleStudentSelection(${student.id})">
                  </td>
                  <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                          <div class="student-avatar" style="width: 40px; height: 40px; font-size: 16px;">
                              ${student.name.charAt(0).toUpperCase()}
                          </div>
                          ${this.highlightText(student.name, searchTerm)}
                      </div>
                  </td>
                  <td>
                      <span class="gpa-badge gpa-${this.getGPAClass(
                        student.gpa
                      )}">
                          ${this.highlightText(student.branch, searchTerm)}
                      </span>
                  </td>
                  <td>Year ${student.year}</td>
                  <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                      ${this.highlightText(student.email, searchTerm)}
                  </td>
                  <td>
                      <span class="gpa-badge gpa-${this.getGPAClass(
                        student.gpa
                      )}">
                          ${student.gpa.toFixed(2)}
                      </span>
                  </td>
              </tr>
          `
      )
      .join("");

    // Update select all checkbox
    const selectAllCheckbox = document.getElementById("selectAllCheckbox");
    selectAllCheckbox.checked =
      this.filteredStudents.length > 0 &&
      this.filteredStudents.every((student) =>
        this.selectedStudents.has(student.id)
      );
  }

  renderCards() {
    const container = document.getElementById("cardsView");
    const searchTerm = document
      .getElementById("searchInput")
      .value.toLowerCase();

    // Define a list of popular skills to be matched
    const popularSkills = [
      "Web Dev",
      "Cybersecurity",
      "DSA",
      "Cloud",
      "AI/ML",
      "Blockchain",
      "Robotics",
      "App Dev",
    ];

    container.innerHTML = this.filteredStudents
      .map((student) => {
        // Find skills in the student's interests that are present in the popularSkills list
        const foundSkills = student.interests.filter((interest) =>
          popularSkills.some((skill) =>
            interest.toLowerCase().includes(skill.toLowerCase())
          )
        );
        const skillsText =
          foundSkills.length > 0
            ? foundSkills.join(", ")
            : "No popular IT skills listed";

        return `
              <div class="student-card ${
                this.selectedStudents.has(student.id) ? "selected" : ""
              }"
                   onclick="dashboard.showProfileModal(${
                     student.id
                   })" style="cursor: pointer;">
                  <div class="student-avatar">
                      ${student.name.charAt(0).toUpperCase()}
                  </div>
                  <div class="student-name">${this.highlightText(
                    student.name,
                    searchTerm
                  )}</div>
                  <div class="student-branch">${this.highlightText(
                    student.branch,
                    searchTerm
                  )}</div>
                  <div class="student-details">
                      <div>📅 Year ${student.year}</div>
                      <div>📧 ${this.highlightText(
                        student.email,
                        searchTerm
                      )}</div>
                      <div>📊 GPA: <span class="gpa-badge gpa-${this.getGPAClass(
                        student.gpa
                      )}">${student.gpa.toFixed(2)}</span></div>
                      <div>🎯 Interests: ${skillsText}</div>
                  </div>
                  <div style="text-align: right; margin-top: 10px;">
                    <input type="checkbox"
                    ${this.selectedStudents.has(student.id) ? "checked" : ""}
                    onclick="event.stopPropagation()"
                    onchange="dashboard.toggleStudentSelection(${student.id})">
                  </div>
              </div>
          `;
      })
      .join("");
  }

  renderAnalytics() {
    this.renderCharts();
  }

  renderCharts() {
    // Destroy existing charts if any
    if (this.charts) {
      Object.values(this.charts).forEach(
        (chart) => chart.destroy && chart.destroy()
      );
    }
    this.charts = {};

    // Get chart data
    const branchData = this.getBranchDistribution();
    const gpaData = this.getGPADistribution();
    const yearData = this.getYearDistribution();

    // Students by Branch Chart
    const branchCtx = document.getElementById("branchChart").getContext("2d");
    this.charts.branchChart = new Chart(branchCtx, {
      type: "bar",
      data: {
        labels: branchData.labels,
        datasets: [
          {
            label: "Students",
            data: branchData.data,
            backgroundColor: "#4e54c8",
          },
        ],
      },
      options: { responsive: true },
    });

    // GPA Distribution Chart
    const gpaCtx = document.getElementById("gpaChart").getContext("2d");
    this.charts.gpaChart = new Chart(gpaCtx, {
      type: "pie",
      data: {
        labels: gpaData.labels,
        datasets: [
          {
            label: "Students",
            data: gpaData.data,
            backgroundColor: ["#10b981", "#f97316", "#ef4444", "#3b82f6"],
          },
        ],
      },
      options: { responsive: true },
    });

    // Students by Year Chart
    const yearCtx = document.getElementById("yearChart").getContext("2d");
    this.charts.yearChart = new Chart(yearCtx, {
      type: "bar",
      data: {
        labels: yearData.labels,
        datasets: [
          {
            label: "Students",
            data: yearData.data,
            backgroundColor: "#4e54c8",
          },
        ],
      },
      options: { responsive: true },
    });
  }

  getBranchDistribution() {
    const branches = {};
    this.filteredStudents.forEach((student) => {
      branches[student.branch] = (branches[student.branch] || 0) + 1;
    });

    return {
      labels: Object.keys(branches),
      data: Object.values(branches),
    };
  }

  getGPADistribution() {
    const ranges = {
      "0-2": 0,
      "2-3": 0,
      "3-3.5": 0,
      "3.5-4": 0,
    };

    this.filteredStudents.forEach((student) => {
      const gpa = student.gpa;
      if (gpa < 2) ranges["0-2"]++;
      else if (gpa < 3) ranges["2-3"]++;
      else if (gpa < 3.5) ranges["3-3.5"]++;
      else ranges["3.5-4"]++;
    });

    return {
      labels: Object.keys(ranges),
      data: Object.values(ranges),
    };
  }

  getYearDistribution() {
    const years = {};
    this.filteredStudents.forEach((student) => {
      const year = `Year ${student.year}`;
      years[year] = (years[year] || 0) + 1;
    });

    return {
      labels: Object.keys(years),
      data: Object.values(years),
    };
  }

  toggleStudentSelection(studentId) {
    if (this.selectedStudents.has(studentId)) {
      this.selectedStudents.delete(studentId);
    } else {
      this.selectedStudents.add(studentId);
    }

    this.updateSelectedCount();
    this.renderCurrentView();
  }

  toggleSelectAll() {
    const allSelected =
      this.filteredStudents.length > 0 &&
      this.filteredStudents.every((student) =>
        this.selectedStudents.has(student.id)
      );

    if (allSelected) {
      this.filteredStudents.forEach((student) => {
        this.selectedStudents.delete(student.id);
      });
    } else {
      this.filteredStudents.forEach((student) => {
        this.selectedStudents.add(student.id);
      });
    }

    this.updateSelectedCount();
    this.renderCurrentView();
  }

  updateSelectedCount() {
    const count = this.selectedStudents.size;
    document.getElementById("selectedCount").textContent = count;
    document.getElementById("emailBtn").disabled = count === 0;

    const selectAllBtn = document.getElementById("selectAllBtn");
    const allSelected =
      this.filteredStudents.length > 0 &&
      this.filteredStudents.every((student) =>
        this.selectedStudents.has(student.id)
      );
    selectAllBtn.textContent = allSelected
      ? "❌ Deselect All"
      : "👥 Select All";
  }

  showEmailModal() {
    const count = this.selectedStudents.size;
    document.getElementById("emailRecipientCount").textContent = count;
    document.getElementById("emailModal").classList.add("show");
  }

  hideEmailModal() {
    document.getElementById("emailModal").classList.remove("show");
    document.getElementById("emailSubject").value = "";
    document.getElementById("emailMessage").value = "";
  }

  sendEmail() {
    const subject = document.getElementById("emailSubject").value;
    const message = document.getElementById("emailMessage").value;

    if (!subject || !message) {
      alert("Please fill in both subject and message fields.");
      return;
    }

    const selectedStudentData = this.students.filter((s) =>
      this.selectedStudents.has(s.id)
    );
    const emails = selectedStudentData
      .map((s) => s.email)
      .filter((email) => email && email.includes("@"));

    if (emails.length === 0) {
      alert("No valid email addresses found for selected students.");
      return;
    }

    // Create mailto link
    const mailtoLink = `mailto:${emails.join(",")}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message)}`;
    window.open(mailtoLink);

    this.hideEmailModal();
    this.selectedStudents.clear();
    this.updateSelectedCount();
    this.renderCurrentView();
  }

  exportData() {
    let studentsToExport;

    // If there are selected students, export them. Otherwise, export filtered students.
    if (this.selectedStudents.size > 0) {
      studentsToExport = this.students.filter((student) =>
        this.selectedStudents.has(student.id)
      );
    } else {
      studentsToExport = this.filteredStudents;
    }

    if (studentsToExport.length === 0) {
      alert("No data to export");
      return;
    }

    const exportData = studentsToExport.map((student) => ({
      Name: student.name,
      Branch: student.branch,
      Year: student.year,
      Email: student.email,
      Phone: student.phone,
      GPA: student.gpa,
      Projects: student.projects,
      Skills: student.skills,
      Status: student.status,
      Interests: student.interests,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `students_export_${date}.xlsx`);
  }

  clearFilters() {
    document.getElementById("searchInput").value = "";
    document.getElementById("branchFilter").value = "";
    document.getElementById("yearFilter").value = "";

    // Reset sorting
    this.sortConfig = { key: null, direction: "asc" };
    document.querySelectorAll(".sort-indicator").forEach((indicator) => {
      indicator.textContent = "";
    });

    this.applyFilters();
  }

  showIncorrectEntriesModal() {
    this.renderIncorrectEntries();
    document.getElementById("incorrectEntriesModal").classList.add("show");
  }

  hideIncorrectEntriesModal() {
    document.getElementById("incorrectEntriesModal").classList.remove("show");
  }

  renderIncorrectEntries() {
    const listContainer = document.getElementById("incorrectEntriesList");
    if (this.incorrectStudents.length === 0) {
      listContainer.innerHTML =
        "<p style='text-align: center;'>No incorrect entries found.</p>";
      return;
    }

    listContainer.innerHTML = this.incorrectStudents
      .map((student) => {
        const errorsList = Object.entries(student.validationErrors)
          .map(
            ([field, error]) =>
              `<li><strong>${
                field.charAt(0).toUpperCase() + field.slice(1)
              }:</strong> ${error}</li>`
          )
          .join("");

        return `
            <div class="student-card" style="cursor: pointer; margin-bottom: 20px; border: 2px solid #ef4444;" onclick="dashboard.showProfileModal(${student.id})">
                <div class="student-name" style="color: #ef4444;">${student.name}</div>
                <p><strong>Errors:</strong></p>
                <ul>${errorsList}</ul>
                <div class="modal-actions" style="justify-content: flex-start; margin-top: 10px;">
                    <button class="btn btn-success" onclick="event.stopPropagation(); dashboard.saveProfileFromIncorrect(${student.id})">
                        Add to Display
                    </button>
                </div>
            </div>
        `;
      })
      .join("");
  }

  // New methods for profile editing
  showProfileModal(studentId) {
    const student =
      this.students.find((s) => s.id === studentId) ||
      this.incorrectStudents.find((s) => s.id === studentId);
    if (!student) return;

    // Clear previous form errors
    this.clearFormErrors("profileForm");

    document.getElementById("profileStudentId").value = student.id;
    document.getElementById("profileName").value = student.name;
    document.getElementById("profileBranch").value = student.branch;
    document.getElementById("profileYear").value = student.year;
    document.getElementById("profileEmail").value = student.email;
    document.getElementById("profileGPA").value = student.gpa;
    document.getElementById("profileInterests").value =
      student.interests.join(", ");

    if (student.validationErrors) {
      for (const key in student.validationErrors) {
        const input = document.getElementById(
          "profile" + key.charAt(0).toUpperCase() + key.slice(1)
        );
        if (input) {
          input.classList.add("error");
          let errorDiv = input.parentElement.querySelector(".error-message");
          if (!errorDiv) {
            errorDiv = document.createElement("div");
            errorDiv.className = "error-message";
            input.parentElement.appendChild(errorDiv);
          }
          errorDiv.textContent = student.validationErrors[key];
        }
      }
    }

    document.getElementById("profileModal").classList.add("show");
  }

  hideProfileModal() {
    this.clearFormErrors("profileForm");
    document.getElementById("profileModal").classList.remove("show");
  }

  saveProfile() {
    const studentId = parseInt(
      document.getElementById("profileStudentId").value
    );

    const studentIndex = this.students.findIndex((s) => s.id === studentId);
    const incorrectIndex = this.incorrectStudents.findIndex(
      (s) => s.id === studentId
    );

    const isIncorrect = incorrectIndex !== -1;
    const studentToUpdate = isIncorrect
      ? this.incorrectStudents[incorrectIndex]
      : this.students[studentIndex];

    const updatedStudent = {
      ...studentToUpdate,
      name: document.getElementById("profileName").value,
      branch: document.getElementById("profileBranch").value,
      year: parseInt(document.getElementById("profileYear").value),
      email: document.getElementById("profileEmail").value,
      gpa: parseFloat(document.getElementById("profileGPA").value),
      interests: document
        .getElementById("profileInterests")
        .value.split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== ""),
    };

    const validationResult = this.validateStudent(updatedStudent);

    if (isIncorrect) {
      if (validationResult.isValid) {
        this.students.push(updatedStudent);
        this.incorrectStudents.splice(incorrectIndex, 1);
        alert(
          `Entry for ${updatedStudent.name} successfully added to the main student list!`
        );
      } else {
        updatedStudent.validationErrors = validationResult.errors;
        this.incorrectStudents[incorrectIndex] = updatedStudent;
        alert("Entry is still incorrect. Please fix all errors before adding.");
      }
    } else {
      if (validationResult.isValid) {
        this.students[studentIndex] = updatedStudent;
        alert(`Entry for ${updatedStudent.name} successfully updated!`);
      } else {
        updatedStudent.validationErrors = validationResult.errors;
        this.incorrectStudents.push(updatedStudent);
        this.students.splice(studentIndex, 1);
        alert("Entry moved to the incorrect list due to validation errors.");
      }
    }

    this.updateStats();
    this.populateFilters();
    this.applyFilters();
    this.renderIncorrectEntries();
    this.updateValidationSummary();
    this.hideProfileModal();
    this.saveDataToLocalStorage();
  }

  saveProfileFromIncorrect(studentId) {
    const student = this.incorrectStudents.find((s) => s.id === studentId);
    if (!student) return;

    const index = this.incorrectStudents.findIndex((s) => s.id === studentId);

    // Check if the entry is now valid before adding to the main list
    const validationResult = this.validateStudent(student);
    if (validationResult.isValid) {
      this.students.push(student);
      this.incorrectStudents.splice(index, 1);

      this.updateStats();
      this.populateFilters();
      this.applyFilters();
      this.renderIncorrectEntries();
      this.updateValidationSummary();
      alert(
        `Entry for ${student.name} successfully added to the main student list!`
      );
      this.saveDataToLocalStorage();
    } else {
      alert("Cannot add entry. It still contains validation errors.");
    }
  }

  highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;

    // Escape regex special characters in the search term
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(`(${escapedTerm})`, "gi");
    return String(text).replace(regex, '<span class="highlight">$1</span>');
  }

  getGPAClass(gpa) {
    if (gpa >= 3.5) return "excellent";
    if (gpa >= 3.0) return "good";
    return "needs-improvement";
  }
}

// Initialize dashboard
const dashboard = new StudentDashboard();
