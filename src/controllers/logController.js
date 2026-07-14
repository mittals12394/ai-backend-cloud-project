const logService = require("../services/logService");

const createLog = async (req, res, next) => {
    try{
        const log = await logService.createLog(req.validatedParams.id, req.body);

        res.status(201).json({
            success: true,
            data: log
        });

    } catch(err){
        next(err);
    }
};

module.exports = {
    createLog
};