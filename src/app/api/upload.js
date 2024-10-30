import { prisma } from "@/lib/prisma";

export async function POST(req, res) {
    try {
      // Create a new upload entry with UUID as the id
      const upload = await prisma.upload.create({
        data: {
          // UUID and dateCreated are automatically handled by Prisma
        },
      });

      res.status(200).json({ upload });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create upload entry.' });
    }
}
