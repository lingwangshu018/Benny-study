// Benny Study · 学习记录本地日期兼容
(function () {
  const originalSaveState = saveState;

  function normalizeDatedRecords() {
    const local = window.BennyLocalTime;
    if (!local) return;

    // 番茄钟保留 startedAt / endedAt 的绝对 ISO 时间，只把“属于哪一天”改成本地日历日期。
    (state.focusSessions || []).forEach(record => {
      if (record.endedAt) record.date = local.dateKey(record.endedAt);
      else if (!record.date && record.startedAt) record.date = local.dateKey(record.startedAt);
    });

    // 训练记录旧版用 UTC 生成可见日期；ID 本身带真实毫秒时间，可据此恢复成本地日期时间。
    (state.training?.history || []).forEach(record => {
      const match = String(record.id || "").match(/^training-(\d{11,})$/);
      if (!match) return;
      const time = Number(match[1]);
      if (Number.isFinite(time)) record.date = local.dateTimeLabel(new Date(time));
    });

    // 错题若只有创建时间没有日历日期，则补成本地日期；用户手填的 date 不覆盖。
    (state.errors || []).forEach(record => {
      if (!record.date && record.createdAt) record.date = local.dateKey(record.createdAt);
    });

    state.meta ||= {};
    state.meta.localTimeZone = local.timeZone;
  }

  saveState = function saveStateWithLocalDates() {
    normalizeDatedRecords();
    originalSaveState();
  };

  normalizeDatedRecords();
  originalSaveState();
})();
