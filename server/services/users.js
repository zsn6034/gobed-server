const UserInfoModel = require('../db/schema/UserInfoModel');

const ACTION_TYPE = {
	CONFIRM: 0,
	CANCEL: 1,
};
exports.ACTION_TYPE = ACTION_TYPE;

// 获取今日日期，如："2021-08-29"
const getTodayDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1) < 10 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
    const date = d.getDate()  < 10 ? `0${d.getDate()}` : d.getDate();
    return `${year}-${month}-${date}`;
};

// 获取今日惩罚金额、今天是否确认、总惩罚金额
exports.getPenalty = async (openid) => {
    try {
        const userInfo = await UserInfoModel.findOne({openid});
        // console.log('getTodayMoney:userInfo===', userInfo)
        return {
            cur_money: userInfo.cur_money || 0,
            has_confirm: userInfo.last_confirm_date === getTodayDate(),
            total_money: userInfo.total_money,
        };
    } catch (e) {
        console.error(e);
        throw new Error('获取今日惩罚金额、今天是否确认、总惩罚金额失败！');
    }
};

// 保存提醒时间
exports.saveTime = async (openid, remind_time, cur_money, total_money, min_money, multiple, max_days, continue_days) => {
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
exports.confirmOrCancel = async (openid, action) => {
    // 数据匹配
    const userInfo = await UserInfoModel.findOne({openid});
    if (!userInfo) {
        console.log('不存在匹配用户：确认or取消失败...');
        return;
    }
    let { cur_money, min_money, multiple, max_days, continue_days, last_confirm_date, last_confirm_action, first_confirm_continue_days } = userInfo;
    let updateContent = {};
    const date = getTodayDate();
    // 说明是当天第一次触发操作的action
    if (last_confirm_date !== date) {
        // 需要惩罚
        if (action === ACTION_TYPE.CANCEL) {
            // 还在当前惩罚天数范围内
            if (continue_days < max_days) {
                updateContent = {
                    continue_days: continue_days + 1,
                    first_confirm_continue_days: continue_days,
                };
            }
            // 到达当前惩罚天数上限，需要翻倍
            else {
                updateContent = {
                    continue_days: 0,
                    cur_money: cur_money * multiple,
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
            else if (cur_money > min_money) {
                updateContent = {
                    cur_money: Math.max(min_money, cur_money / multiple),
                    continue_days: Math.max(max_days, 1),
                    first_confirm_continue_days: continue_days,
                };
            }
            // 说明已到最初值：continue_days=0，cur_money=min_money
            else {
                updateContent = { first_confirm_continue_days: continue_days };
            }
        }
        updateContent = { ...updateContent, last_confirm_date: date, last_confirm_action: action };
    }
    // 说明是当天第N次(N>1)触发操作的action
    else {
        // 重复操作，直接返回
        if (action === last_confirm_action) return;
        // 需要修改为惩罚
        if (action === ACTION_TYPE.CANCEL) {
            // 说明在初始惩罚阶段（金额未翻倍），且当天第一次操作前conitune_days就为0，本次conitune_day只需要+1
            if (cur_money === min_money && first_confirm_continue_days === 0) {
                updateContent = { continue_days: continue_days + 1 };
            }
            // 还在当前惩罚天数-1范围内
            else if (continue_days < max_days - 1) {
                updateContent = { continue_days: continue_days + 2 };
            }
            // 到达当前惩罚天数上限，需要翻倍
            else {
                updateContent = {
                    continue_days: (continue_days + 1) % max_days,
                    cur_money: cur_money * multiple,
                };
            }
        }
        // 需要修改为无需惩罚
        else {
            if (cur_money === min_money) {
                if (continue_days >= 2) {
                    updateContent = { continue_days: continue_days - 2 };
                }
                else {
                    updateContent = { continue_days: 0 };
                }
            } else {
                if (continue_days === 0) {
                    updateContent = {
                        continue_days: Math.max(max_days -1, 0),
                        cur_money: Math.max(cur_money / multiple, min_money),
                    };
                } else if (continue_days === 1) {
                    updateContent = {
                        continue_days: max_days,
                        cur_money: Math.max(cur_money / multiple, min_money),
                    };
                } else if (continue_days > 1) {
                    updateContent = {
                        continue_days: continue_days - 2,
                    };
                } else return;
            }
        }
        updateContent = { ...updateContent, last_confirm_date: date, last_confirm_action: action };
    }
    try {
        return await UserInfoModel.findOneAndUpdate({openid}, updateContent, {
            new: true,
            // upsert: true,
        });
    } catch (e) {
        console.error(e);
        throw new Error('确认or取消失败！');
    }
};