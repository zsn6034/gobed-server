
const status = require('../common/status');
const userService = require('../services/users');
const loginService = require('../services/login');
const config = require('../config/wx_config');
const { token, appID, appScrect } = config;
const WX = require('../services/wx');
const miniapp = new WX({
    token,
    appID,
    appScrect
})

function hello (ctx) {
	let user = ctx.request.query.user
	ctx.ok({ user })
}

// 获取今日惩罚金额、今天是否确认、总惩罚金额
const getPenalty = async (ctx) => {
	const query = ctx.request.query;
	console.log('getPenalty:::query', query);
	const { _3rd_session } = query;
	try {
		// 使用_3rd_session获取openid
		const arr = await loginService.getData(_3rd_session);
		const openid = arr[0]['openid'];
		const { cur_money, has_confirm, total_money} = await userService.getPenalty(openid);
		status.success(ctx, { cur_money, has_confirm, total_money });
	} catch (e) {
		console.error('saveTime.error====', e);
		status.warning(ctx, '获取今日惩罚金额失败！');
	}
};

// 保存用户设置的提醒时间
const saveTime = async (ctx) => {
	const body = ctx.request.body;
	const { remind_time, _3rd_session } = body;
	try {
		// 使用_3rd_session获取openid
		const arr = await loginService.getData(_3rd_session);
		const openid = arr[0]['openid'];
		// 获取access_token（暂时没用，在发送订阅消息时用到）
		// const token = await miniapp.getAccessToken();
		// 创建or更新用户信息
		const cur_money = 20;
		const total_money = 0;
		const min_money = 20;
		const multiple = 1.5;
		const max_days = 3;
		await userService.saveTime(openid, remind_time, cur_money, total_money, min_money, multiple, max_days);
		status.success(ctx);
	} catch (e) {
		console.error('saveTime.error====', e);
		status.warning(ctx, '更新用户信息失败！');
	}
};



// 确认or取消：用户告知server本次是否遵守约定完成按时睡觉
const confirmOrCancel = async (ctx) => {
	const body = ctx.request.body;
	const { action, _3rd_session } = body;
	if (action !== userService.ACTION_TYPE.CONFIRM && action !== userService.ACTION_TYPE.CANCEL) {
		console.log(`action传参有误。必须为${userService.ACTION_TYPE.CONFIRM}或${userService.ACTION_TYPE.CANCEL}`);
		status.warning(ctx, `action传参有误。必须为${userService.ACTION_TYPE.CONFIRM}或${userService.ACTION_TYPE.CANCEL}`);
		return;
	}
	try {
		// 使用_3rd_session获取openid
		const arr = await loginService.getData(_3rd_session);
		const openid = arr[0]['openid'];
		await userService.confirmOrCancel(openid, action);
		status.success(ctx);
	} catch (e) {
		console.error('confirmOrCancel.error====', e);
		status.warning(ctx, '确认or取消失败！');
	}
};

module.exports = {
	hello,
	getPenalty,
	saveTime,
	confirmOrCancel,
}
