const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  await prisma.logEntry.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.user.deleteMany();

  const sahil = await prisma.user.create({
    data: {
      name: 'Sahil Mittal',
      email: 'sahil@test.com'
    }
  });

  const issue1 = await prisma.issue.create({
    data: {
      title: 'Login Failure',
      description: 'Users unable to login',
      status: 'OPEN',
      severity: 'HIGH',
      userId: sahil.id
    }
  });

  await prisma.logEntry.create({
    data: {
      rawText: 'Authentication token expired',
      source: 'SYSTEM',
      issueId: issue1.id
    }
  });

  console.log('✅ Seed completed');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });