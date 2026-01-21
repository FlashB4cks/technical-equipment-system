import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const technicians = await prisma.technician.findMany({
        include: {
            area: true,
            _count: {
                select: { assignedEquipment: true },
            },
        },
    })
    return NextResponse.json(technicians)
}

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const technician = await prisma.technician.create({
            data: {
                name: json.name,
                areaId: json.areaId ? parseInt(json.areaId) : null,
            },
        })
        return NextResponse.json(technician)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating technician' }, { status: 500 })
    }
}
