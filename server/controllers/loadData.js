const status = require('../common/status');

// /gobed/loadData/period 数据周期性更新
exports.getPeriod = async (ctx) => {
    const query = ctx.request.query;
    console.log(query);
    const { appid, token, timestamp } = query;
    console.log(appid);
    console.log(token);
    console.log(timestamp);

    return status.success(ctx, {
        msg: "success"
    });
}

// /gobed/loadData/preparatory 数据预拉取
exports.getPreparatory = async (ctx) => {
    const query = ctx.request.query;
    console.log(query);
    const { appid, token, timestamp } = query;
    console.log(appid);
    console.log(token);
    console.log(timestamp);

    ctx.body = "haha"
    // return status.success(ctx, {
    //     msg: "success"
    // });
}