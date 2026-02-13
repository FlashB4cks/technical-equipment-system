
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        // 1. Link Technician 'Joaquin' (id 1) to User 'Joaquin' (id 2)
        // First check if already linked to avoid error
        const tech = await prisma.technician.findUnique({ where: { id: 1 } })
        if (!tech.userId) {
            console.log('Linking Technician 1 to User 2...')
            await prisma.technician.update({
                where: { id: 1 },
                data: { userId: 2 }
            })
            console.log('Link successful.')
        } else {
            console.log('Technician 1 already linked to user:', tech.userId)
        }

        // 2. Alert about SN
        const duplicate = await prisma.equipment.findUnique({ where: { serialNumber: 'SN' } })
        if (duplicate) {
            console.log('\nWARNING: Serial Number "SN" already exists (ID: ' + duplicate.id + '). This causes validation error.')
        }

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
