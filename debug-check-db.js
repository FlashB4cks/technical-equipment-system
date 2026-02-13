
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('--- Equipment Serial Numbers ---')
        const equipment = await prisma.equipment.findMany({ select: { id: true, serialNumber: true } })
        console.log(equipment)

        console.log('\n--- Technicians ---')
        const technicians = await prisma.technician.findMany({ select: { id: true, name: true, userId: true } })
        console.log(technicians)

        console.log('\n--- Users ---')
        const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } })
        console.log(users)

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
