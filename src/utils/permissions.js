const canModifyIssue = (user, issue) => {
    if (user.role == "ADMIN") return true;

    return user.id === issue.userId;
};

module.exports = {
    canModifyIssue
};