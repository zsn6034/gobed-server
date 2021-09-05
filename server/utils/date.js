// 日期转换成字符串：2021-08-31
const date2String = date => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
    const day = date.getDate() + 1 < 10 ? `0${date.getDate()}` : date.getDate();
    const result = year + '-' + month + '-' + day;
    return result;
};
exports.date2String = date2String;

// 获取昨天日期
const getYesterday = () => {
    const d = new Date();
    d.setTime(d.getTime() - 24 * 60 * 60 * 1000);
    return date2String(d);
};
// console.log('getYesterday:::', getYesterday());
exports.getYesterday = getYesterday;

// 获取今天日期
const getToday = () => {
    const d = new Date();
    return date2String(d);
};
// console.log('getToday:::', getToday());
exports.getToday = getToday;
