const { date2String, getToday } = require('../utils/date');
const UserInfoModel = require('../db/schema/UserInfoModel');
const RecordModel = require('../db/schema/RecordModel');

const ACTION_TYPE = {
    NO_ACTION: 0, // 无操作
	CONFIRM: -1, // 确认，不需要惩罚
	CANCEL: 1, // 取消，需要惩罚
};
exports.ACTION_TYPE = ACTION_TYPE;

// 获取今日惩罚金额、今天是否确认、总惩罚金额、提醒时间
exports.getPenalty = async (openid) => {
    try {
        const userInfo = await UserInfoModel.findOne({openid});
        // console.log('getTodayMoney:userInfo===', userInfo)
        return {
            cur_money: userInfo.cur_money || 0,
            has_confirm: userInfo.last_confirm_date === getToday(),
            total_money: userInfo.total_money,
            remind_time: userInfo.remind_time,
        };
    } catch (e) {
        console.error(e);
        throw new Error('获取今日惩罚金额、今天是否确认、总惩罚金额失败！');
    }
};

// 获取record列表(最近几天)
exports.getRecordList = async (openid, count) => {
    const dates = [];
    for (let i = 0; i < count; i += 1) {
        const d = new Date();
        d.setTime(d.getTime() - i * 24 * 60 * 60 * 1000);
        dates.push(date2String(d));
    }
    try {
        return await RecordModel.find({openid, date: {'$in': dates}}).sort({date: 1});
    } catch (e) {
        console.error(e);
        throw new Error(`获取record列表(最近${count}天)失败！`);
    }
};

// 保存提醒时间（相当于重置）
exports.saveTime = async ({
    openid,
    remind_time,
    cur_money,
    total_money,
    min_money,
    multiple,
    max_days,
    continue_days,
    last_confirm_date,
    last_confirm_action,
    first_confirm_continue_days
    }) => {
    try {
        return await UserInfoModel.findOneAndUpdate({openid}, {
            openid,
            remind_time,
            cur_money,
            total_money,
            min_money,
            multiple,
            max_days,
            continue_days,
            last_confirm_date,
            last_confirm_action,
            first_confirm_continue_days,
        }, {
            new: true,
            upsert: true,
        });
    } catch (e) {
        console.error(e);
        throw new Error('保存提醒时间失败！');
    }
};

// 确认or取消
// 当max_days = 3时，continue_days允许取值范围：0、1、2
exports.confirmOrCancel = async (openid, action, date) => {
    // 数据匹配
    const userInfo = await UserInfoModel.findOne({openid});
    if (!userInfo) {
        console.log('不存在匹配用户：确认or取消失败...');
        return;
    }
    const { cur_money, total_money, min_money, multiple, max_days, continue_days, last_confirm_date, last_confirm_action, first_confirm_continue_days } = userInfo;
    let updateContent = {};
    const today = getToday();
    // 说明是当天第一次触发操作的action
    if (last_confirm_date !== today) {
        // 需要惩罚
        if (action === ACTION_TYPE.CANCEL) {
            // 还在当前惩罚天数范围内
            if (continue_days < max_days - 1) {
                updateContent = {
                    continue_days: continue_days + 1,
                    total_money: total_money + cur_money,
                    first_confirm_continue_days: continue_days,
                };
            }
            // 到达当前惩罚天数上限，需要翻倍
            else {
                updateContent = {
                    continue_days: 0,
                    cur_money: cur_money * multiple,
                    total_money: total_money + cur_money,
                    first_confirm_continue_days: continue_days,
                };
            }
        }
        // 无需惩罚
        else {
            // 还在当前惩罚天数范围内
            if (continue_days > 0) {
                updateContent = {
                    continue_days: continue_days - 1,
                    first_confirm_continue_days: continue_days,
                };
            }
            // 到达当前惩罚天数下限，需要减倍（惩罚金额不得小于最小值）
            else if (continue_days === 0 && cur_money > min_money) {
                updateContent = {
                    cur_money: Math.max(min_money, cur_money / multiple),
                    continue_days: Math.max(max_days - 1, 0),
                    first_confirm_continue_days: continue_days,
                };
            }
            // 说明已到最初值：continue_days=0，cur_money=min_money
            else {
                updateContent = { first_confirm_continue_days: continue_days };
            }
        }
        updateContent = { ...updateContent, last_confirm_date: today, last_confirm_action: action };
    }
    // 说明是当天第N次(N>1)触发操作的action
    else {
        // 重复操作，直接返回
        if (action === last_confirm_action) return;
        // 需要修改为惩罚
        if (action === ACTION_TYPE.CANCEL) {
            // 说明在初始惩罚阶段（金额未翻倍），且当天第一次操作前conitune_days就为0，本次conitune_day只需要+1
            if (cur_money === min_money && first_confirm_continue_days === 0) {
                updateContent = {
                    continue_days: first_confirm_continue_days + 1,
                    total_money: total_money + cur_money,
                };
            }
            // 还在当前惩罚天数范围内
            else if (continue_days < max_days - 2) {
                updateContent = {
                    continue_days: continue_days + 2,
                    total_money: total_money + cur_money,
                };
            }
            // 到达当前惩罚天数上限，需要翻倍，如：max_days = 3, continue_days = 1
            else if (continue_days === max_days - 2) {
                updateContent = {
                    continue_days: 0,
                    cur_money: cur_money * multiple,
                    total_money: total_money + cur_money,
                };
            }
            // 到达当前惩罚天数上限，需要翻倍，如：max_days = 3, continue_days = 2
            else if (continue_days === max_days - 1) {
                updateContent = {
                    continue_days: 1,
                    cur_money: cur_money * multiple,
                    total_money: total_money + cur_money * multiple,
                };
            } else return;
        }
        // 需要修改为无需惩罚
        else {
            // 说明在初始惩罚阶段（金额未翻倍）
            if (cur_money === min_money) {
                if (continue_days > 1) {
                    updateContent = {
                        continue_days: continue_days - 2,
                        total_money: Math.max(total_money - cur_money, 0),
                    };
                }
                else if (continue_days === 1) {
                    updateContent = {
                        continue_days: 0,
                        total_money: Math.max(total_money - cur_money, 0),
                    };
                } else return;
            } else {
                if (continue_days === 0) {
                    updateContent = {
                        continue_days: Math.max(max_days - 2, 0),
                        cur_money: Math.max(cur_money / multiple, min_money),
                        total_money: Math.max(total_money - Math.max(cur_money / multiple, min_money), 0),
                    };
                } else if (continue_days === 1) {
                    updateContent = {
                        continue_days: Math.max(max_days - 1, 0),
                        cur_money: Math.max(cur_money / multiple, min_money),
                        total_money: Math.max(total_money - cur_money, 0),
                    };
                } else if (continue_days > 1) {
                    updateContent = {
                        continue_days: continue_days - 2,
                        total_money: Math.max(total_money - cur_money, 0),
                    };
                } else return;
            }
        }
        updateContent = { ...updateContent, last_confirm_date: today, last_confirm_action: action };
    }
    try {
        // 1.更新record表
        await RecordModel.findOneAndUpdate({ openid, date }, { last_confirm_action: action, last_confirm_date: today });
        // 2.更新user_info表
        return await UserInfoModel.findOneAndUpdate({openid}, updateContent, {
            new: true,
            // upsert: true,
        });
    } catch (e) {
        console.error(e);
        throw new Error('确认or取消失败！');
    }
};