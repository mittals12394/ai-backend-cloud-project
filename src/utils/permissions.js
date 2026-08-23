const canModifySchema = (user, issue) => {
    if (user.role == "ADMIN") return true;

    return user.id === issue.userId;
};

export default {
    canModifySchema
};