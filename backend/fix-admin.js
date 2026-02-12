const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('ChangeMe123!', 12);
    await prisma.adminUser.upsert({
      where: { email: 'admin@atu.edu.gh' },
      update: { passwordHash: hashedPassword },
      create: {
        email: 'admin@atu.edu.gh',
        passwordHash: hashedPassword
      }
    });
    console.log('✅ Admin account created/updated: admin@atu.edu.gh');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();