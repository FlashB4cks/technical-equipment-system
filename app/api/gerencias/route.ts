import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const gerencias = await prisma.gerencia.findMany({
      include: {
        areas: true // Include areas for nested display if needed
      },
      orderBy: {
        name: 'asc'
      }
    });
    return NextResponse.json(gerencias);
  } catch (error) {
    console.error('Error fetching gerencias:', error);
    return NextResponse.json({ error: 'Error fetching gerencias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const gerencia = await prisma.gerencia.create({
      data: {
        name
      }
    });

    return NextResponse.json(gerencia);
  } catch (error) {
    console.error('Error creating gerencia:', error);
    return NextResponse.json({ error: 'Error creating gerencia' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID and Name are required' }, { status: 400 });
    }

    const gerencia = await prisma.gerencia.update({
      where: { id },
      data: { name }
    });

    return NextResponse.json(gerencia);
  } catch (error) {
    console.error('Error updating gerencia:', error);
    return NextResponse.json({ error: 'Error updating gerencia' }, { status: 500 });
  }
}
