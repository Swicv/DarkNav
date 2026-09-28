/**
 * 轻量零依赖中国农历工具
 * 支持 2000 - 2050 年动态农历换算
 */

// 农历年份数据表 (2000 - 2050)
// 编码规则:
// 0-3位: 闰月月份 (0为无闰月)
// 4-15位: 1-12月大小月标志 (1为大月30天，0为小月29天)
// 16位: 闰月大月标志 (1为30天，0为29天)
const LUNAR_INFO = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 2000-2009
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 2010-2019
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 2020-2029
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 2030-2039
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 2040-2049
  0x06ca0                                                                                      // 2050
];

const BASE_YEAR = 2000;
// 2000年春节对应的公历日期为 2000-02-05
const BASE_DATE = new Date(2000, 1, 5).getTime();

const CHINESE_NUMS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

// 获取某农历年总天数
function getLunarYearDays(year: number): number {
  let sum = 348;
  const info = LUNAR_INFO[year - BASE_YEAR];
  if (!info) return 365;

  for (let i = 0x8000; i > 0x8; i >>= 1) {
    if ((info & i) !== 0) sum += 1;
  }
  return sum + getLeapMonthDays(year);
}

// 获取某农历年闰月月份 (0 为无闰月)
function getLeapMonth(year: number): number {
  const info = LUNAR_INFO[year - BASE_YEAR];
  return info ? info & 0xf : 0;
}

// 获取某农历年闰月天数
function getLeapMonthDays(year: number): number {
  if (getLeapMonth(year) === 0) return 0;
  const info = LUNAR_INFO[year - BASE_YEAR];
  return (info & 0x10000) !== 0 ? 30 : 29;
}

// 获取某农历年某月天数
function getLunarMonthDays(year: number, month: number): number {
  const info = LUNAR_INFO[year - BASE_YEAR];
  if (!info) return 30;
  return (info & (0x10000 >> month)) !== 0 ? 30 : 29;
}

// 格式化农历日
function formatLunarDay(day: number): string {
  if (day === 10) return '初十';
  if (day === 20) return '二十';
  if (day === 30) return '三十';
  const ten = Math.floor(day / 10);
  const one = day % 10;
  const prefix = ten === 0 ? '初' : ten === 1 ? '十' : '廿';
  return prefix + CHINESE_NUMS[one];
}

export function getLunarDateString(date: Date = new Date()): string {
  const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  let offset = Math.floor((targetTime - BASE_DATE) / 86400000);

  if (offset < 0 || date.getFullYear() > 2050) {
    return '农历吉祥';
  }

  let year = BASE_YEAR;
  let yearDays = 0;

  for (; year <= 2050 && offset > 0; year++) {
    yearDays = getLunarYearDays(year);
    if (offset < yearDays) break;
    offset -= yearDays;
  }

  const leapMonth = getLeapMonth(year);
  let month = 1;
  let isLeap = false;

  for (; month <= 12; month++) {
    const monthDays = getLunarMonthDays(year, month);
    if (offset < monthDays) break;
    offset -= monthDays;

    if (leapMonth > 0 && month === leapMonth) {
      const leapDays = getLeapMonthDays(year);
      if (offset < leapDays) {
        isLeap = true;
        break;
      }
      offset -= leapDays;
    }
  }

  const day = offset + 1;
  const monthStr = (isLeap ? '闰' : '') + MONTH_NAMES[month - 1] + '月';
  const dayStr = formatLunarDay(day);

  return `${monthStr}${dayStr}`;
}
