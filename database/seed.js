const bcrypt = require('bcryptjs');
const { db, User, Project, Task } = require('./setup');

async function seedDatabase() {
    try {
        await db.sync({ force: true });
        console.log('Database reset successfully.');

        const hashedPassword = await bcrypt.hash('password123', 10);

        const users = await User.bulkCreate([
            {
                name: 'John Employee',
                email: 'john@company.com',
                password: hashedPassword,
                role: 'employee'
            },
            {
                name: 'Sarah Manager',
                email: 'sarah@company.com',
                password: hashedPassword,
                role: 'manager'
            },
            {
                name: 'Mike Admin',
                email: 'mike@company.com',
                password: hashedPassword,
                role: 'admin'
            }
        ]);

        const projects = await Project.bulkCreate([
            {
                name: 'Website Redesign',
                description: 'Complete overhaul of company website',
                managerId: users[1].id,
                status: 'active'
            },
            {
                name: 'Mobile App Development',
                description: 'New mobile app',
                managerId: users[1].id,
                status: 'active'
            },
            {
                name: 'Database Migration',
                description: 'Move legacy database',
                managerId: users[2].id,
                status: 'planning'
            }
        ]);

        await Task.bulkCreate([
            {
                title: 'Design homepage mockup',
                description: 'Create wireframes',
                projectId: projects[0].id,
                assignedUserId: users[0].id,
                status: 'in-progress',
                priority: 'high'
            },
            {
                title: 'Set up dev environment',
                description: 'Configure setup',
                projectId: projects[1].id,
                assignedUserId: users[0].id,
                status: 'completed',
                priority: 'medium'
            },
            {
                title: 'Review database schema',
                description: 'Analyze DB',
                projectId: projects[2].id,
                assignedUserId: users[1].id,
                status: 'pending',
                priority: 'high'
            }
        ]);

        console.log('Database seeded successfully!');
        console.log('Users created:');
        console.log('john@company.com (employee)');
        console.log('sarah@company.com (manager)');
        console.log('mike@company.com (admin)');
        console.log('Password: password123');

    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await db.close();
    }
}

seedDatabase();