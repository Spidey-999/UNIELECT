const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('?? Creating admin account...');
    const hashedPassword = await bcrypt.hash('ChangeMe123!', 12);
    console.log('?? Password hashed successfully');
    
    const admin = await prisma.adminUser.create({
      data: {
        email: 'admin@atu.edu.gh',
        passwordHash: hashedPassword
      }
    });
    
    console.log('? Admin created:', admin.email);
  } catch (error) {
    console.error('? Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();