import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req, res) {
    try {
      // Create a new upload entry with UUID as the id
      const upload = await prisma.upload.create({
        data: {
          // UUID and dateCreated are automatically handled by Prisma
        },
      });

      return NextResponse.json(upload); // Return the estimate if found
    } catch (error) {
      return NextResponse.json({error: 'Failed to create upload entry.' }); // Return the estimate if found
    }
}
