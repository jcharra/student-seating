const MAX_ROWS = 6;
const MAX_COLUMNS = 12;
const FLAGS = {
  de: "🇩🇪",
  fr: "🇫🇷",
  en: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  us: "🇺🇸",
  es: "🇪🇸"
};

class SeatingOrder {
  constructor({ htmlContainerId, courseId, api }) {
    this.courseId = courseId;
    this.api = api;
    this.initHTML(htmlContainerId);
    this.teachersView = true;
    this.studentMap = {};
    this.grid = [];
    this.gaps = [];
    this.changed = [];

    $.get(this.api.getCourseData + "?refId=" + this.courseId, (data) => {
      this.students = data.students;
      this.teacherName = data.teacherName;

      this.addShortnames();
      this.students.forEach(s => {
        this.studentMap[s.id] = s;
      });
      this.seatsInRow = Array(Math.ceil(this.students.length / 8)).fill(8);
      this.rebuildGrid(false);
    });

    $('.toast').toast({ delay: 2000 });
  }

  toggleView() {
    this.teachersView = !this.teachersView;

    if (this.teachersView) {
      $("#gridModification, #distribution").removeClass("d-none").addClass("d-flex");
      $("#toggleViewButton").text("Zur Schüleransicht wechseln");
    } else {
      $("#gridModification, #distribution").removeClass("d-flex").addClass("d-none");
      $("#toggleViewButton").text("Zur Lehreransicht wechseln");
    }

    this.renderGrid();
  }

  addShortnames() {
    // set fullnames for comparison
    for (const s of this.students) {
      let fname = s.firstname;
      if (s.firstname.length > 10) {
        if (s.firstname.indexOf("-") > -1) {
          const parts = s.firstname.split("-");
          fname = parts[0] + "-" + parts[1][0] + ".";
        } else if (s.firstname.indexOf(" ") > -1) {
          fname = s.firstname.split(" ")[0];
        } else {
          fname = s.firstname.slice(0, 8) + ".";
        }
      }
      s.fullname = fname + " " + s.name;
    }

    for (const s of this.students) {
      for (let i = s.fullname.indexOf(" "); i < s.fullname.length; i++) {
        // check incrementally longer names for uniqueness
        const candidate = s.fullname.slice(0, i);
        if (this.students.filter(s2 => s.id != s2.id && this.removeAccents(s2.fullname).startsWith(this.removeAccents(candidate))).length === 0) {
          s.shortname = i > s.firstname.length && candidate[candidate.length - 1] != " " ? candidate + "." : candidate.trim();
          break;
        }
      }

      if (!s.shortname) {
        s.shortname = s.fullname;
      }
    }
  }

  removeAccents(str) {
    // Ignore accents when comparing names for uniqueness.
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  rebuildGrid(keepSeatedStudents) {
    const newGrid = [];
    for (let i = 0; i < this.seatsInRow.length; i++) {
      const row = [];
      for (let j = 0; j < this.seatsInRow[i]; j++) {
        const elemId = i + "_" + j;
        row.push({
          id: elemId,
          studentId: keepSeatedStudents ? this.grid[i]?.[j]?.studentId : null
        });
      }
      newGrid.push(row);
    }

    this.grid = newGrid;
    this.checkButtons();
    this.renderGrid();
  }

  checkButtons() {
    const numOfSeatsWithoutLastRow = this.seatsInRow.slice(0, this.seatsInRow.length - 1).reduce((acc, value) => acc + value, 0);
    $("#deleteRow").prop("disabled", numOfSeatsWithoutLastRow < this.students.length);
    $("#addRow").prop("disabled", this.seatsInRow.length >= MAX_ROWS);
  }

  renderStudent(sid) {
    if (!sid) return "";
    const s = this.studentMap[sid];
    return `${s.shortname} <br>${s.cls || ""} ${s.lang ? FLAGS[s.lang] : ""}`;
  }

  renderGrid() {
    const classRoom = $("#classroom");
    classRoom.empty();

    const directionCls = this.teachersView ? "flex-column-reverse" : "flex-column";
    const container = $("<div>", {
      class: `d-flex justify-center align-content-center align-items-center m-5 ${directionCls}`
    });
    classRoom.append(container);

    // Teacher node
    const teacherNode = $('<div>', {
      class: 'justify-center border border-dark w-25 text-center py-3 my-2 teacher',
      html: `<div id="teacherName">${this.teacherName}</div><div id="switchHint">Ansicht wechseln</div>`,
      id: 'teacher'
    });
    container.append(teacherNode);

    // Grid nodes
    for (let rowIdx = 0; rowIdx < this.grid.length; rowIdx++) {
      const row = this.grid[rowIdx];
      const rowDirectionCls = this.teachersView ? "flex-row-reverse" : "flex-row";
      let rowElem = $('<div>', {
        class: "m-3 d-flex align-items-start " + rowDirectionCls,
      });


      for (let colIdx = 0; colIdx < row.length; colIdx++) {
        const seat = row[colIdx];
        let cssClasses = "seat border border-dark text-center px-1 d-inline-block align-items-center align-content-center";
        let seatText = "";

        if (seat.studentId) {
          const student = this.studentMap[seat.studentId];

          if (seat.studentId === this.firstClickedStudentId) {
            cssClasses += " highlighted";
          }

          if (this.changed.indexOf(seat.studentId) > -1) {
            cssClasses += " changed";
          }
        }

        $('<div>', {
          class: cssClasses,
          id: seat.id,
          html: this.renderStudent(seat.studentId)
        }).appendTo(rowElem);

        if (colIdx < row.length - 1) {
          $('<div>', {
            class: this.gaps.indexOf(seat.id) === -1 ? "gap" : "gap gap_active"
          })
            .on("click", () => this.toggleGap(seat.id))
            .appendTo(rowElem);
        }
      }

      if (this.teachersView) {
        const addRemoveButtons = this.generateAddRemoveButtons(rowIdx);
        addRemoveButtons.appendTo(rowElem);
      }

      container.append(rowElem);
    }

    this.unseated = this.getUnseatedStudents();
    this.unseated.sort((a, b) => this.studentMap[a].shortname.localeCompare(this.studentMap[b].shortname));
    const unseatedElem = $("#unseated");
    unseatedElem.empty();
    for (const [idx, studentId] of this.unseated.entries()) {
      let cssClasses = "seat border border-dark text-center px-1 mb-2 mr-2 align-items-center align-content-center";
      if (this.firstClickedStudentId === studentId) {
        cssClasses += " highlighted";
      }
      if (this.changed.indexOf(studentId) > -1) {
        cssClasses += " changed";
      }

      $('<div>', {
        class: cssClasses,
        id: "u_" + idx,
        html: this.renderStudent(studentId)
      }).appendTo(unseatedElem);
    }

    // reset to empty list
    this.changed = [];

    $("#clearButton").prop("disabled", this.unseated.length === 0);
    $("#teacher").off("click");
    $("#teacher").on("click", () => this.toggleView());

    $(".seat").off("click");
    $(".seat").on("click", (e) => this.onSelect(e.target.id));
    $(".addButton, .removeButton").off("click");
    $(".addButton, .removeButton").on("click", (e) => this.onModify(e.target.id));
  }

  generateAddRemoveButtons(rowIndex) {
    const add_disabled = this.seatsInRow[rowIndex] >= MAX_COLUMNS ? "btn-disabled" : "";
    const remove_disabled = this.seatsInRow[rowIndex] <= 1 || this.getTotalNumberOfSeats() <= this.students.length ? "btn-disabled" : "";

    const html = `<div class='addButton ${add_disabled}' id='prepend_${rowIndex}'>+</div><div class='removeButton ${remove_disabled}' id='shift_${rowIndex}'>-</div>`;

    return $('<div>', {
      class: "addRemoveButtons",
      html
    });
  }

  getTotalNumberOfSeats() {
    return this.seatsInRow.reduce((a, b) => a + b, 0);
  }

  onModify(elemId) {
    const [action, rowIdx] = elemId.split("_");
    if (action === "prepend") {
      if (this.seatsInRow[rowIdx] < MAX_COLUMNS) {
        this.seatsInRow[rowIdx]++;
      } else {
        this.showToast("Es sind maximal " + MAX_COLUMNS + " Plätze pro Reihe erlaubt!");
      }
    }

    if (action === "shift") {
      if (this.seatsInRow[rowIdx] > 1 && this.getTotalNumberOfSeats() > this.students.length) {
        this.seatsInRow[rowIdx]--;
      } else {
        this.showToast("Die Mindestanzahl von Sitzen darf nicht unterschritten werden!");
      }
    }
    this.rebuildGrid(true);
  }

  toggleGap(seatId) {
    if (this.gaps.indexOf(seatId) > -1) {
      this.gaps = this.gaps.filter(g => g !== seatId);
    } else {
      this.gaps.push(seatId);
    }
    this.renderGrid();
  }

  fillUnseatedStudents() {
    const unseated = this.getUnseatedStudents();
    for (const id of unseated) {
      let attempts = 0;
      while (attempts < 10000) {
        const randRow = Math.floor(Math.random() * this.seatsInRow.length);
        const randCol = Math.floor(Math.random() * this.seatsInRow[randRow]);

        if (!this.grid[randRow][randCol].studentId) {
          this.grid[randRow][randCol].studentId = id;
          this.changed.push(id);
          break;
        }
        attempts++;
      }
    }

    this.renderGrid();
  }

  changeRows(deltaRows) {
    if (deltaRows === 1 && this.seatsInRow.length < MAX_ROWS) {
      // Copy last element to end
      this.seatsInRow.push(this.seatsInRow[this.seatsInRow.length - 1]);
    } else {
      this.seatsInRow.pop();
    }
    this.rebuildGrid(true);
  }

  getUnseatedStudents() {
    const ids = this.students.map(s => s.id);
    const seated = [];
    for (let i = 0; i < this.seatsInRow.length; i++) {
      for (let j = 0; j < this.seatsInRow[i]; j++) {
        if (this.grid[i][j].studentId) {
          seated.push(this.grid[i][j].studentId);
        }
      }
    }
    return ids.filter(i => seated.indexOf(i) === -1);
  }

  findCellWithStudentId(sid) {
    for (let i = 0; i < this.seatsInRow.length; i++) {
      for (let j = 0; j < this.seatsInRow[i]; j++) {
        if (this.grid[i][j].studentId === sid) {
          return this.grid[i][j];
        }
      }
    }
  }

  onSelect(gridId) {
    let [gridCell, lastClickedStudentId] = [null, null];

    if (gridId.startsWith("u")) {
      const idx = gridId.split("_")[1];
      lastClickedStudentId = this.unseated[idx];
    } else {
      const [row, col] = gridId.split("_");
      gridCell = this.grid[row][col];
      lastClickedStudentId = gridCell.studentId;
    }

    // Case 1: First click => select student and return
    if (!this.firstClickedStudentId) {
      this.firstClickedStudentId = lastClickedStudentId;
      this.renderGrid();
      console.log("Selected", this.firstClickedStudentId);
      return;
    }

    // Case 2: Second click after selection. Swap/Move selected student.
    const originCell = this.findCellWithStudentId(this.firstClickedStudentId);
    if (lastClickedStudentId) {
      // Two clicks on same student => move to bench
      if (lastClickedStudentId === this.firstClickedStudentId) {
        if (originCell) {
          originCell.studentId = null;
          this.changed = [lastClickedStudentId];
        }
      } else {
        if (originCell && gridCell) {
          // Swap between two grid cells
          originCell.studentId = gridCell.studentId;
          gridCell.studentId = this.firstClickedStudentId;
          this.changed = [lastClickedStudentId, this.firstClickedStudentId];
        } else if (originCell) {
          // Swap from grid to bench
          originCell.studentId = lastClickedStudentId;
          this.changed = [lastClickedStudentId, this.firstClickedStudentId];
        } else if (gridCell) {
          // Swap from bench to grid
          gridCell.studentId = this.firstClickedStudentId;
          this.changed = [lastClickedStudentId, this.firstClickedStudentId];
        } else {
          console.log("Invalid swap");
        }
      }
    } else {
      if (originCell) {
        originCell.studentId = null;
      }
      gridCell.studentId = this.firstClickedStudentId;
      this.changed = [this.firstClickedStudentId];
    }

    this.firstClickedStudentId = null;
    this.renderGrid();
  }

  saveSeatingPlan() {
    const plan = {
      grid: this.grid,
      gaps: this.gaps
    }

    $.post(this.api.save,
      {
        refId: this.courseId,
        jsonContent: JSON.stringify(plan),
        isPublic: 1
      },
      () => this.showToast("Die Sitzordnung wurde gespeichert!")
    );
  }

  clearGrid() {
    if (this.getUnseatedStudents().length < this.students.length && confirm("Sitzordnung leeren?")) {
      this.rebuildGrid(false);
    }
  }

  showToast(contentHtml) {
    const toast = $('#feedback');
    toast.find('.toast-body').html(contentHtml);
    toast.toast('show');
  }

  initHTML(containerId) {
    const template = `
    <div id="gridModification" class="d-flex justify-content-center w-100 my-2">
      <button id="addRow" class="btn btn-primary mx-2 my-1">Reihe hinzufügen</button>
      <button id="deleteRow" class="btn btn-primary mx-2 my-1">Reihe entfernen</button>
    </div>

    <div id="classroom">
    </div>

    <div id="distribution" class="d-flex justify-content-center">
      <button id="randomize" class="btn btn-primary mx-2 my-1">
        Verbleibende SuS zufällig verteilen
      </button>
      <button id="clear" class="btn btn-warning mx-2 my-1">
        Alle Plätze leeren
      </button>
      <button id="saveSeatingOrder" class="btn btn-success my-1">
        Sitzordnung speichern
      </button>
    </div>

    <div id="unseated" class="m-3 d-flex flex-wrap align-items-start justify-content-center">
    </div>

    <div id="feedback" class="toast mx-4" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-body">
        Success
      </div>
    </div>`;

    $(containerId).html(template);
    $(`${containerId} #addRow`).on("click", () => this.changeRows(1));
    $(`${containerId} #deleteRow`).on("click", () => this.changeRows(-1));
    $(`${containerId} #randomize`).on("click", () => this.fillUnseatedStudents());
    $(`${containerId} #clear`).on("click", () => this.clearGrid());
    $(`${containerId} #saveSeatingOrder`).on("click", () => this.saveSeatingPlan());
  }
}