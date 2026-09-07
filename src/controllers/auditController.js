const auditService = require("../services/auditService");

const getAudit = async (req, res, next) => {
    try {
        const result = await auditService.getAudit();

        return res.status(201).json({
        success: true,
        data: result,
        });       

    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAudit
};