const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    console.log('?? Updating admin account...');
    const hashedPassword = await bcrypt.hash('ChangeMe123!', 12);
    console.log('?? Password hashed successfully');
    
    const admin = await prisma.adminUser.update({
      where: { email: 'admin@atu.edu.gh' },
      data: { passwordHash: hashedPassword }
    });
    
    console.log('? Admin updated:', admin.email);
  } catch (error) {
    console.error('? Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();