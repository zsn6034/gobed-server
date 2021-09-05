const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const db = require('../index');

const userInfoSchema = new Schema({
    openid: String, // 用户id
    remind_time: String, // 提醒时间（时:分），如：20:33
    cur_money: Number, // 当前惩罚金额，如：20
    total_money: Number, // 总惩罚金额，如：100
    min_money: Number, // 最小惩罚金额，如：20
    multiple: Number, // 惩罚金额翻倍对应倍数，如：1.5
    max_days: Number, // 到达惩罚翻倍所需天数，如：3
    continue_days: Number, // 当前倍数连续天数（每天根据last_modify_action判断+1或-1，到达max_days时需要翻倍，到达0时需要减倍），如：2
    last_confirm_date: String, // 最近一次触发确认操作的日期，如：2021-08-29
    last_confirm_action: Number, // 最近一次触发操作的action，如：1（1代表今日需要惩罚，且当前倍数对应continue_days需要加1；反之-1代表今日不需要惩罚，且continue_days减1；0代表无操作）
    first_confirm_continue_days: Number, // 当天第一次触发操作时对应的continue_days，如：0
});

const userInfoModel = db.model('user_info', userInfoSchema);

module.exports = userInfoModel;