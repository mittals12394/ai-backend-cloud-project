const prisma = require('../config/prisma');

const getAudit = async () => {
    return await prisma.auditLog.findMany();
}

module.exports = {
    getAudit
};