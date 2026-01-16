import { demoTickets } from "@/lib/demo-data";
import { TicketStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const tickets = await prisma.ticket.findMany({ orderBy: { code: "desc" } });
    return Response.json(tickets);
  } catch {
    return Response.json(demoTickets);
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    code: string;
    unit: string;
    applicantName: string;
    roleType: string;
    ext: string;
    purpose: string;
    category: string;
    status?: TicketStatus;
    assignedToName?: string;
    applicantId: string;
  };

  try {
    const { prisma } = await import("@/lib/prisma");
    const created = await prisma.ticket.create({
      data: {
        ...payload,
        status: payload.status ?? TicketStatus.PENDING,
      },
    });

    return Response.json(created, { status: 201 });
  } catch {
    return Response.json({ error: "Prisma not ready" }, { status: 503 });
  }
}
