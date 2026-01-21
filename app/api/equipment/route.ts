import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

export async function GET() {
    const equipment = await prisma.equipment.findMany({
        include: {
            area: true,
            technician: true,
        },
        orderBy: {
            entryDate: 'desc',
        },
    })
    return NextResponse.json(equipment)
}

export async function POST(request: Request) {
    try {
        const json = await request.json()

        // Validate uniqueness of serial number
        const existing = await prisma.equipment.findUnique({
            where: { serialNumber: json.serialNumber }
        })

        if (existing) {
            return NextResponse.json({ error: 'Serial number already exists' }, { status: 400 })
        }

        const equipment = await prisma.equipment.create({
            data: {
                type: json.type,
                model: json.model,
                serialNumber: json.serialNumber,
                status: json.status || "Pending",
                reportedFailure: json.reportedFailure || null,
                areaId: json.areaId ? parseInt(json.areaId) : null,
                technicianId: json.technicianId ? parseInt(json.technicianId) : null,
            },
        })
        return NextResponse.json(equipment)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Error creating equipment' }, { status: 500 })
    }
}
