// Benny Study · 本地日期自动排课修复 v0.1
(function () {
  const BASE_TARGET = "2026-08-30";
  const QUESTION_SEA_END = "2026-10-04";
  const BREAKTHROUGH_END = "2026-10-18";
  const SIMULATION_END = "2026-12-05";

  function localToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function laterDate(a, b) {
    if (!a) return b;
    if (!b) return a;
    return String(a) > String(b) ? String(a) : String(b);
  }

  function migrateScheduleSettings() {
    state.settings ||= {};
    const today = localToday();

    // 旧版把 2026-08-03 写死在本地存档里。过去日期自动抬到设备“今天”。
    state.settings.startDate = laterDate(state.settings.startDate, today);

    // 当前学习安排：基础轮延至 8/30。
    state.settings.baseTarget = BASE_TARGET;
    state.settings.baseMax = BASE_TARGET;

    // 保留当前学习量配置：基础轮视频学习量 8h，后续阶段 4h；
    // 其余时间用于刷题、错题和复盘，总学习量由每日计划共同组成。
    if (!Number.isFinite(Number(state.settings.baseVideoHours)) || Number(state.settings.baseVideoHours) <= 0) {
      state.settings.baseVideoHours = 8;
    }
    if (!Number.isFinite(Number(state.settings.laterVideoHours)) || Number(state.settings.laterVideoHours) <= 0) {
      state.settings.laterVideoHours = 4;
    }
  }

  autoSchedule = function autoScheduleFromLocalToday() {
    migrateScheduleSettings();
    state.plan = [];
    state.courses.forEach(course => {
      course.planDate = "";
      course.slot = "";
    });

    // 自动排课永远不会从设备本地“今天”之前开始；
    // 若用户设置了未来开始日期，则尊重那个更晚的日期。
    let start = laterDate(state.settings.startDate, localToday());
    state.settings.startDate = start;

    const configs = {
      基础轮: {
        preferred: BASE_TARGET,
        max: BASE_TARGET,
        hours: Number(state.settings.baseVideoHours) || 8
      },
      题海轮: {
        preferred: QUESTION_SEA_END,
        max: QUESTION_SEA_END,
        hours: Number(state.settings.laterVideoHours) || 4
      },
      突破轮: {
        preferred: BREAKTHROUGH_END,
        max: BREAKTHROUGH_END,
        hours: Number(state.settings.laterVideoHours) || 4
      },
      模拟轮: {
        preferred: SIMULATION_END,
        max: SIMULATION_END,
        hours: Number(state.settings.laterVideoHours) || 4
      }
    };

    for (const phase of PHASES) {
      const result = allocatePhase(state.courses.filter(course => course.phase === phase), start, configs[phase]);
      state.plan.push(...result.days);
      start = addDays(result.end, 1);
    }
    state.plan.sort((a, b) => a.date.localeCompare(b.date));
  };

  // 页面加载时先修正旧存档里的 8/3，不立即重排；用户点“自动排课”时再生成新计划。
  migrateScheduleSettings();
  saveState();
})();
