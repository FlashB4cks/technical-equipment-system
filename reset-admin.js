
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
    try {
        // Find existing admin
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        })

        if (!admin) {
            console.log('No administrator found. Creating one...')
            // Create default admin if none exists
            const hashed = await bcrypt.hash('admin123', 10)
            const newAdmin = await prisma.user.create({
                data: {
                    name: 'Administrador',
                    email: 'admin@admin.com',
                    password: hashed,
                    role: 'ADMIN'
                }
            })
            console.log('Admin created:')
            console.log('Email:', newAdmin.email)
            console.log('Password: admin123')
        } else {
            console.log('Administrator found:', admin.email)
            const hashed = await bcrypt.hash('admin123', 10)
            await prisma.user.update({
                where: { id: admin.id },
                data: { password: hashed }
            })
            console.log('Password updated successfully.')
            console.log('Email:', admin.email)
            console.log('New Password: admin123')
        }

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
