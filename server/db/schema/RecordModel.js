const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const db = require('../index');

const recordSchema = new Schema({
    openid: String, // 用户id
    date: String, // 该记录所属日期，如：2021-08-28
    remind_time: String, // 提醒时间（时:分），如：20:33
    cur_money: Number, // 当前惩罚金额，如：20
    last_confirm_date: String, // 最近一次触发确认操作的日期，如：2021-08-29
    last_confirm_action: Number, // 最近一次触发操作的action，如：1（1代表今日需要惩罚，且当前倍数对应continue_days需要加1；反之-1代表今日不需要惩罚，且continue_days减1；0代表无操作）
});

const recordModel = db.model('record', recordSchema);

module.exports = recordModel;