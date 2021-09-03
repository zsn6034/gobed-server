const status = {
    success(ctx, data) {
        let successData = {
            status: 0
        };
        if (!data) {
            ctx.body = successData;
        }
        else {
            ctx.body = Object.assign({}, successData, data);
        }
    },
    warning(ctx, msg) {
        ctx.body = {
            status: 1,
            message: msg
        };
    },
    error(ctx, msg, other) {
        ctx.body = {
            status: 2,
            message: msg,
            other
        };
    },
    noLogin(ctx, err) {
        ctx.body = {
            status: 3,
            message: err
        };
    },
    noPermission(ctx) {
        ctx.status = 403;
        ctx.body = {
            status: 1,
            message: '该账号无权限访问'
        };
    },
    redirect(ctx, data) {
        ctx.body = {
            status: 4,
            message: data.message
        };
    },
    judge(ctx, data) {
        if (data.code === 0) {
            return this.success(ctx);
        }

        return this.error(ctx, data.message);
    }
};

module.exports = status;
