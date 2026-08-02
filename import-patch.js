// Excel import compatibility patch for Benny Study.
// Supports both course collection workbooks and the exported battle-system workbook.

function excelDateToISO(value) {
  if (!value && value !== 0) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return dateISO(value);
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const text = String(value).trim();
  if (!text) return "";
  const direct = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (direct) return `${direct[1]}-${direct[2].padStart(2, "0")}-${direct[3].padStart(2, "0")}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : dateISO(parsed);
}

function sheetRows(workbook, name) {
  const ws = workbook.Sheets[name];
  return ws ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true }) : [];
}

function headerIndex(headers, names) {
  for (const name of names) {
    const index = headers.indexOf(name);
    if (index >= 0) return index;
  }
  return -1;
}

function readCourseCollectionWorkbook(workbook) {
  const courses = [];
  PHASES.forEach(phase => {
    const rows = sheetRows(workbook, phase);
    if (!rows.length) return;
    const headers = rows[0].map(x => String(x).trim());
    const moduleIndex = headerIndex(headers, ["模块"]);
    const chapterIndex = headerIndex(headers, ["章节"]);
    const nameIndex = headerIndex(headers, ["课程名称", "课程/资源名称", "名称"]);
    const durationIndex = headerIndex(headers, ["视频时长", "时长", "原字段"]);
    if (nameIndex < 0) return;

    rows.slice(1).filter(row => row[nameIndex]).forEach((row, index) => {
      const module = String(row[moduleIndex] || "");
      const duration = String(row[durationIndex] || "");
      const type = module.trim() === "齐麟数资" ? "pages" : "video";
      courses.push({
        id: `${phase}-${index + 1}`,
        phase,
        module,
        chapter: String(row[chapterIndex] || ""),
        name: String(row[nameIndex] || ""),
        duration,
        minutes: type === "video" ? parseMinutes(duration) : 0,
        type,
        done: false,
        planDate: "",
        slot: ""
      });
    });
  });
  return courses;
}

function readBattleSystemCourses(workbook) {
  const rows = sheetRows(workbook, "完整课程库");
  if (!rows.length) return [];
  const headers = rows[0].map(x => String(x).trim());
  const idIndex = headerIndex(headers, ["编号"]);
  const phaseIndex = headerIndex(headers, ["阶段"]);
  const moduleIndex = headerIndex(headers, ["模块"]);
  const chapterIndex = headerIndex(headers, ["章节"]);
  const nameIndex = headerIndex(headers, ["课程/资源名称", "课程名称", "名称"]);
  const originalIndex = headerIndex(headers, ["原字段", "视频时长", "时长"]);
  const resourceIndex = headerIndex(headers, ["资源类型"]);
  const x2Index = headerIndex(headers, ["2倍速分钟"]);
  const planDateIndex = headerIndex(headers, ["计划日期"]);
  const slotIndex = headerIndex(headers, ["时段"]);
  const statusIndex = headerIndex(headers, ["完成状态"]);
  const completedDateIndex = headerIndex(headers, ["完成日期"]);
  if (phaseIndex < 0 || nameIndex < 0) return [];

  return rows.slice(1).filter(row => row[nameIndex]).map((row, index) => {
    const module = String(row[moduleIndex] || "");
    const resourceLabel = String(row[resourceIndex] || "");
    const duration = String(row[originalIndex] || "");
    const isPages = module.trim() === "齐麟数资" || /刷题|页数/.test(resourceLabel);
    const x2Minutes = Number(row[x2Index]);
    const minutes = isPages ? 0 : (Number.isFinite(x2Minutes) && x2Minutes > 0 ? x2Minutes * 2 : parseMinutes(duration));
    const status = String(row[statusIndex] || "未完成");
    return {
      id: String(row[idIndex] || `${row[phaseIndex]}-${index + 1}`),
      phase: String(row[phaseIndex] || ""),
      module,
      chapter: String(row[chapterIndex] || ""),
      name: String(row[nameIndex] || ""),
      duration,
      minutes,
      type: isPages ? "pages" : "video",
      done: status === "已完成",
      planDate: excelDateToISO(row[planDateIndex]),
      slot: String(row[slotIndex] || ""),
      completedDate: excelDateToISO(row[completedDateIndex])
    };
  }).filter(course => PHASES.includes(course.phase));
}

function rebuildPlanFromImportedDates(courses) {
  const grouped = new Map();
  courses.filter(course => course.planDate).forEach(course => {
    if (!grouped.has(course.planDate)) grouped.set(course.planDate, []);
    grouped.get(course.planDate).push(course);
  });
  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, tasks]) => {
    const videos = tasks.filter(course => course.type === "video");
    const split = Math.ceil(videos.length / 2);
    videos.forEach((course, index) => {
      if (!course.slot) course.slot = index < split ? "morning" : "afternoon";
    });
    tasks.filter(course => course.type !== "video").forEach(course => {
      if (!course.slot) course.slot = "afternoon";
    });
    return {
      date: day,
      phase: tasks[0]?.phase || "",
      tasks,
      videoHours: videos.reduce((sum, course) => sum + course.minutes / 2, 0) / 60
    };
  });
}

function readBattleSystemErrors(workbook) {
  const rows = sheetRows(workbook, "错题库");
  if (!rows.length) return [];
  const h = rows[0].map(x => String(x).trim());
  const at = names => headerIndex(h, names);
  const date = at(["日期"]), subject = at(["科目"]), chapter = at(["章节/题型", "章节"]);
  const type = at(["错误类型"]), reason = at(["错误原因"]), method = at(["正确方法"]);
  const review = at(["复习日期"]), status = at(["状态"]);
  return rows.slice(1).filter(row => row[date] || row[subject] || row[reason]).map(row => ({
    date: excelDateToISO(row[date]),
    subject: String(row[subject] || ""),
    chapter: String(row[chapter] || ""),
    type: String(row[type] || "其他"),
    reason: String(row[reason] || ""),
    method: String(row[method] || ""),
    reviewDate: excelDateToISO(row[review]),
    status: String(row[status] || "待复习")
  }));
}

function readBattleSystemWeekly(workbook) {
  const rows = sheetRows(workbook, "每周复盘");
  if (!rows.length) return [];
  const h = rows[0].map(x => String(x).trim());
  const at = names => headerIndex(h, names);
  const week = at(["日期范围", "周次"]), hours = at(["实际学习小时", "学习小时"]);
  const highlights = at(["完成亮点"]), problems = at(["本周问题"]);
  const weakness = at(["薄弱模块"]), adjustment = at(["下周调整"]);
  return rows.slice(1).filter(row => row[week] || row[hours] || row[highlights]).map(row => ({
    week: String(row[week] || ""), hours: String(row[hours] || ""),
    highlights: String(row[highlights] || ""), problems: String(row[problems] || ""),
    weakness: String(row[weakness] || ""), adjustment: String(row[adjustment] || "")
  }));
}

function readBattleSystemExams(workbook) {
  const rows = sheetRows(workbook, "考试中心");
  if (!rows.length) return {};
  const h = rows[0].map(x => String(x).trim());
  const at = names => headerIndex(h, names);
  const date = at(["考试日期"]), xingce = at(["行测成绩"]), shenlun = at(["申论成绩"]);
  const problem = at(["最大失分模块", "考场问题"]), adjustment = at(["后续调整"]);
  const notes = {};
  rows.slice(1).forEach(row => {
    const key = excelDateToISO(row[date]);
    if (!key) return;
    notes[key] = {
      xingce: String(row[xingce] || ""), shenlun: String(row[shenlun] || ""),
      problem: String(row[problem] || ""), adjustment: String(row[adjustment] || "")
    };
  });
  return notes;
}

window.importExcel = async function importExcelCompatible(file) {
  if (typeof XLSX === "undefined") throw new Error("Excel 解析库未加载，请联网后刷新。");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheets = workbook.SheetNames;
  const isBattleSystem = sheets.includes("完整课程库");
  const isCourseCollection = PHASES.some(phase => sheets.includes(phase));

  if (!isBattleSystem && !isCourseCollection) {
    throw new Error("无法识别这个 Excel。需要包含“完整课程库”，或包含“基础轮/题海轮/突破轮/模拟轮”工作表。");
  }

  if (isBattleSystem) {
    const courses = readBattleSystemCourses(workbook);
    if (!courses.length) throw new Error("找到了“完整课程库”，但没有读取到有效课程。请确认表头没有被修改。");
    state.courses = courses;
    state.errors = readBattleSystemErrors(workbook);
    state.weekly = readBattleSystemWeekly(workbook);
    state.examNotes = readBattleSystemExams(workbook);
    state.plan = rebuildPlanFromImportedDates(courses);
    if (!state.plan.length) autoSchedule();
    saveState();
    render();
    alert(`已识别为“公考作战系统”并恢复：${courses.length} 项课程、${state.errors.length} 条错题、${state.weekly.length} 条周复盘。`);
    return;
  }

  const courses = readCourseCollectionWorkbook(workbook);
  if (!courses.length) throw new Error("找到了阶段工作表，但没有读取到课程。需要包含“模块、章节、课程名称、视频时长”列。");
  state.courses = courses;
  autoSchedule();
  saveState();
  render();
  alert(`已识别为“课程集合”，成功导入 ${courses.length} 项课程/资源并完成自动排课。`);
};
