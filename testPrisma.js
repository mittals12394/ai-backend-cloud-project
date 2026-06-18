const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Sahil",
      email: "sahil@test.com"
    }
  });

  console.log(user);
}

main();