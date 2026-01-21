import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get('equipmentId')

    const where = equipmentId ? { equipmentId: parseInt(equipmentId) } : {}

    const maintenance = await prisma.maintenance.findMany({
        where,
        include: {
            equipment: true,
            technician: true,
        },
        orderBy: {
            date: 'desc',
        },
    })
    return NextResponse.json(maintenance)
}

export async function POST(request: Request) {
    try {
        const json = await request.json()

        // Create maintenance record
        const maintenance = await prisma.maintenance.create({
            data: {
                diagnosis: json.diagnosis,
                resolution: json.resolution || null,
                observations: json.observations,
                status: json.status || 'Scheduled',
                equipmentId: parseInt(json.equipmentId),
                technicianId: json.technicianId ? parseInt(json.technicianId) : null,
            },
        })

        // Update equipment status and next maintenance date
        await prisma.equipment.update({
            where: { id: parseInt(json.equipmentId) },
            data: {
                status: json.status === 'Completed' ? 'Ready' : 'Maintenance',
                nextMaintenanceDate: json.nextMaintenanceDate ? new Date(json.nextMaintenanceDate) : undefined
            }
        })

        return NextResponse.json(maintenance)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error creating maintenance record' }, { status: 500 })
    }
}
