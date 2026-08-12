module.exports = {
  validIssue: {
    title: 'Login Failure',
    description: 'Users cannot login',
    userId: 1,
    status: 'OPEN',
    severity: 'HIGH'
  },

  updateIssue: {
    status: 'IN_PROGRESS'
  },

  invalidIssue: {
    description: 'Missing title'
  },

  closedIssue: {
    title: 'Closed Issue',
    description: 'Already closed',
    userId: 1,
    status: 'CLOSED',
    severity: 'LOW'
  }
};