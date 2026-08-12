// Benny Study · 设备本地时区日期核心 v1
(function () {
  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function asDate(value = new Date()) {
    if (value instanceof Date) return new Date(value.getTime());
    return new Date(value);
  }

  function localDateISO(value = new Date()) {
    const d = asDate(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function localDateTimeLabel(value = new Date()) {
    const d = asDate(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${localDateISO(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function dateKey(value) {
    if (!value) return "";
    if (value instanceof Date) return localDateISO(value);
    const text = String(value).trim();

    // 纯日期和旧版无时区的“YYYY-MM-DD HH:mm”本身就是本地日历值，不重新解析。
    if (/^\d{4}-\d{2}-\d{2}(?:$|\s)/.test(text)) return text.slice(0, 10);

    // 带 T 的 ISO 时间戳（尤其是 ...Z）按设备当前时区换算后再决定属于哪一天。
    if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
      const d = new Date(text);
      if (!Number.isNaN(d.getTime())) return localDateISO(d);
    }

    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? text.slice(0, 10) : localDateISO(d);
  }

  function calendarSerial(date) {
    const text = typeof date === "string" ? date.slice(0, 10) : localDateISO(date);
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return NaN;
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000;
  }

  function localDaysUntil(date) {
    const target = calendarSerial(date);
    const today = calendarSerial(localDateISO(new Date()));
    return Number.isFinite(target) && Number.isFinite(today) ? Math.round(target - today) : 0;
  }

  window.BennyLocalTime = {
    today: () => localDateISO(new Date()),
    dateISO: localDateISO,
    dateKey,
    dateTimeLabel: localDateTimeLabel,
    daysUntil: localDaysUntil,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "local"
  };

  // 兼容旧代码：所有 dateISO(new Date()) 统一返回设备本地日历日期。
  dateISO = localDateISO;
  daysUntil = localDaysUntil;
  nextExam = function nextExamByLocalDate() {
    return EXAMS.find(exam => localDaysUntil(exam.date) >= 0) || EXAMS.at(-1);
  };
})();
