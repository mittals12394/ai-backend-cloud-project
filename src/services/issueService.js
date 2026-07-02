const prisma = require('../config/prisma');

const createIssue = async (data) => {
    const user = await prisma.user.findUnique({
        where: { id: data.userId }
    });

    if (!user) {
        throw new Error("User not found");
    }

    return await prisma.issue.create({
        data
    });
};

module.exports = {
    createIssue
};