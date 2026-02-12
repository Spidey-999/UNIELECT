import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user with stronger password
  const adminEmail = 'admin@unielect.edu.gh';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'; // Use environment variable in production

  if (adminPassword === 'ChangeMe123!' && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  WARNING: Using default admin password in production! Set ADMIN_PASSWORD environment variable.');
  }

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash: hashedPassword
      }
    });
    console.log(`✅ Created admin user: ${adminEmail}`);
    console.log(`🔑 Default password: ${adminPassword} (CHANGE THIS IN PRODUCTION!)`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  // Create sample user
  const userEmail = 'student@unielect.edu.gh';
  const userPassword = 'Student123!';

  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail }
  });

  if (!existingUser) {
    const hashedUserPassword = await bcrypt.hash(userPassword, 12);
    await prisma.user.create({
      data: {
        email: userEmail,
        firstName: 'Test',
        lastName: 'Student',
        passwordHash: hashedUserPassword,
        phoneNumber: '+233-24-123-4567'
      }
    });
    console.log(`✅ Created sample user: ${userEmail}`);
    console.log(`🔑 Sample user password: ${userPassword}`);
    console.log(`🎓 Sample Student ID format: 01244086B (8 numbers + 1 capital letter)`);
  } else {
    console.log(`ℹ️  Sample user already exists: ${userEmail}`);
  }

  // Create multiple sample elections
  const currentYear = new Date().getFullYear();
  const elections = [
    {
      title: `UNIELECT SRC Election`,
      description: 'Vote for your next UNIELECT Student Representative Council leaders including President, Vice President, Secretary, and Treasurer.',
      startsAt: new Date(`${currentYear}-01-01T00:00:00Z`),
      endsAt: new Date(`${currentYear}-12-31T23:59:59Z`),
      method: 'FPTP',
      races: [
        {
          title: 'SRC President',
          maxChoices: 1,
          description: 'Choose next UNIELECT SRC President who will lead student body.',
          candidates: [
            {
              name: 'Alice Johnson',
              bio: 'Final year Computer Engineering student passionate about technical innovation and student rights. Experience in UNIELECT student government for 2 years.'
            },
            {
              name: 'Bob Smith',
              bio: 'Third year Electrical Engineering student focused on academic excellence and career development. Dean\'s List student with leadership experience.'
            },
            {
              name: 'Carol Davis',
              bio: 'Second year Mechanical Engineering student advocating for sustainability and environmental initiatives. Founder of UNIELECT Green Campus club.'
            }
          ]
        },
        {
          title: 'Vice President',
          maxChoices: 1,
          description: 'Select Vice President who will support President and lead committees.',
          candidates: [
            {
              name: 'David Wilson',
              bio: 'Final year Civil Engineering student with excellent organizational skills. Captain of UNIELECT debate team.'
            },
            {
              name: 'Emma Brown',
              bio: 'Third year Business Administration student experienced in event planning and communication. UNIELECT student activities coordinator.'
            }
          ]
        },
        {
          title: 'Secretary',
          maxChoices: 1,
          description: 'Choose next SRC Secretary responsible for meeting minutes and communications.',
          candidates: [
            {
              name: 'Frank Miller',
              bio: 'Final year Computer Science student with excellent writing and documentation skills. Editor of UNIELECT student newspaper.'
            },
            {
              name: 'Grace Lee',
              bio: 'Third year Information Technology student experienced in digital communications and social media management.'
            }
          ]
        },
        {
          title: 'Treasurer',
          maxChoices: 1,
          description: 'Select Treasurer who will manage SRC budget and finances.',
          candidates: [
            {
              name: 'Henry Chen',
              bio: 'Final year Accounting student with internship experience at Accra financial institution.'
            },
            {
              name: 'Isabella Rodriguez',
              bio: 'Third year Accounting student with background in budget management. UNIELECT Math club treasurer.'
            }
          ]
        }
      ]
    },
    {
      title: `UNIELECT Departmental Representative Election`,
      description: 'Vote for your department representatives to voice your concerns in UNIELECT SRC.',
      startsAt: new Date(`${currentYear}-02-01T00:00:00Z`),
      endsAt: new Date(`${currentYear}-02-28T23:59:59Z`),
      method: 'FPTP',
      races: [
        {
          title: 'Engineering Department Rep',
          maxChoices: 2,
          description: 'Choose 2 representatives from Engineering Department.',
          candidates: [
            {
              name: 'Jake Thompson',
              bio: 'Computer Engineering student interested in improving lab facilities and technical resources.'
            },
            {
              name: 'Sophia Martinez',
              bio: 'Electrical Engineering student passionate about renewable energy projects and innovation.'
            },
            {
              name: 'Liam Anderson',
              bio: 'Mechanical Engineering student wanting to improve workshop access and equipment.'
            },
            {
              name: 'Olivia Taylor',
              bio: 'Civil Engineering student focused on infrastructure improvements and safety.'
            }
          ]
        },
        {
          title: 'Business Department Rep',
          maxChoices: 2,
          description: 'Choose 2 representatives from Business Department.',
          candidates: [
            {
              name: 'Marcus Johnson',
              bio: 'Business Administration student advocating for better internship opportunities.'
            },
            {
              name: 'Ava White',
              bio: 'Accounting student interested in financial transparency and student funding.'
            }
          ]
        },
        {
          title: 'Applied Sciences Rep',
          maxChoices: 2,
          description: 'Choose 2 representatives from Applied Sciences Department.',
          candidates: [
            {
              name: 'Noah Davis',
              bio: 'Computer Science student focused on coding bootcamps and tech workshops.'
            },
            {
              name: 'Mia Garcia',
              bio: 'Information Technology student advocating for better network infrastructure.'
            }
          ]
        },
        {
          title: 'Applied Arts & Technology Rep',
          maxChoices: 2,
          description: 'Choose 2 representatives from Applied Arts & Technology Department.',
          candidates: [
            {
              name: 'Ethan Wilson',
              bio: 'Graphic Design student focused on creative spaces and equipment access.'
            },
            {
              name: 'Charlotte Brown',
              bio: 'Fashion Design student interested in sustainability and ethical fashion.'
            }
          ]
        }
      ]
    },
    {
      title: `UNIELECT Club Funding Referendum`,
      description: 'Vote on how to distribute UNIELECT student activity funds among campus clubs.',
      startsAt: new Date(`${currentYear}-03-01T00:00:00Z`),
      endsAt: new Date(`${currentYear}-03-15T23:59:59Z`),
      method: 'FPTP',
      races: [
        {
          title: 'Funding Allocation',
          maxChoices: 1,
          description: 'Choose preferred method for distributing UNIELECT club funds.',
          candidates: [
            {
              name: 'Equal Distribution',
              bio: 'Distribute funds equally among all registered UNIELECT student clubs based on membership size.'
            },
            {
              name: 'Merit-Based Distribution',
              bio: 'Allocate funds based on club achievements, events, and community impact at UNIELECT.'
            },
            {
              name: 'Student Vote Distribution',
              bio: 'Let UNIELECT students vote directly on which specific projects and events should receive funding.'
            }
          ]
        }
      ]
    },
    {
      title: `UNIELECT Campus Improvement Survey`,
      description: 'Vote on priority UNIELECT campus improvement projects for the next academic year.',
      startsAt: new Date(`${currentYear}-04-01T00:00:00Z`),
      endsAt: new Date(`${currentYear}-04-30T23:59:59Z`),
      method: 'FPTP',
      races: [
        {
          title: 'Top Priority Improvement',
          maxChoices: 1,
          description: 'Choose most important UNIELECT campus improvement project.',
          candidates: [
            {
              name: 'Library Renovation',
              bio: 'Modernize UNIELECT library with new study spaces, technology, and extended hours.'
            },
            {
              name: 'Engineering Labs Upgrade',
              bio: 'Upgrade UNIELECT engineering laboratories with new equipment and safety features.'
            },
            {
              name: 'Student Lounge Expansion',
              bio: 'Create more UNIELECT student social spaces with comfortable seating, Wi-Fi, and charging stations.'
            },
            {
              name: 'Campus Sustainability',
              bio: 'Implement solar panels, water bottle filling stations, and recycling programs at UNIELECT.'
            }
          ]
        }
      ]
    }
  ];

  // Create each election if it doesn't exist
  for (const electionData of elections) {
    const existingElection = await prisma.election.findFirst({
      where: { title: electionData.title }
    });

    if (!existingElection) {
      const election = await prisma.election.create({
        data: {
          title: electionData.title,
          description: electionData.description,
          startsAt: electionData.startsAt,
          endsAt: electionData.endsAt,
          method: electionData.method,
          races: {
            create: electionData.races.map(race => ({
              title: race.title,
              maxChoices: race.maxChoices,
              description: race.description,
              candidates: {
                create: race.candidates
              }
            }))
          }
        }
      });
      console.log(`✅ Created election: ${election.title}`);
    } else {
      console.log(`ℹ️  Election already exists: ${electionData.title}`);
    }
  }

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
