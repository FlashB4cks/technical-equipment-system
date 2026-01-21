import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const areas = await prisma.area.findMany({
        include: {
            _count: {
                select: { technicians: true, equipment: true },
            },
        },
    })
    return NextResponse.json(areas)
}

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const area = await prisma.area.create({
            data: {
                name: json.name,
            },
        })
        return NextResponse.json(area)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating area' }, { status: 500 })
    }
}
